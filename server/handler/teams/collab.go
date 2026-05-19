package teams

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/samouraiworld/topofgnomes/server/teams"
	"gorm.io/gorm"
)

const (
	collabCacheTTL  = 5 * time.Minute
	collabSchemaVer = 1
	// Hide noise contributors that pollute the matrix (review bots).
	// Case-insensitive match on the GitHub login.
	collabBotLogin = "dependabot"
)

// collabRow is one (author_team, reviewer_team, count) cell.
type collabRow struct {
	AuthorTeam   string `json:"authorTeam"`
	ReviewerTeam string `json:"reviewerTeam"`
	Reviews      int    `json:"reviews"`
}

type collabResponse struct {
	SchemaVersion int        `json:"schemaVersion"`
	LastSyncedAt  *time.Time `json:"lastSyncedAt"`
	Period        string     `json:"period"`
	// Stable team-slug list in the order the matrix axes should be drawn.
	// Matches the roster from teams.yaml (lowercase slugs).
	Teams []string `json:"teams"`
	// Sparse list of non-zero cells. Frontend builds the 2D matrix.
	// Order: by AuthorTeam asc, ReviewerTeam asc.
	Cells []collabRow `json:"cells"`
	// Outsider review counts — reviews where author or reviewer doesn't
	// belong to any team in the roster. Useful for honesty in the
	// "what we're missing" footer of the chart.
	OutsiderReviewsByAuthorTeam   map[string]int `json:"outsiderReviewsByAuthorTeam,omitempty"`
	OutsiderReviewsByReviewerTeam map[string]int `json:"outsiderReviewsByReviewerTeam,omitempty"`
}

// HandleGetTeamCollab returns the cross-team review matrix. Each cell is
// the number of MERGED-PR reviews where a member of team `authorTeam`
// authored the PR and a member of team `reviewerTeam` reviewed it.
//
// Dependabot is excluded from both sides; self-reviews (same user as
// author) are excluded too.
//
// `?time=` accepts `daily|weekly|monthly|yearly|""`(all-time).
// Cached 5 min via ristretto keyed on the period.
func HandleGetTeamCollab(db *gorm.DB, cfg *teams.Config, cache *ristretto.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		period := r.URL.Query().Get("time")
		key := fmt.Sprintf("team-collab:%s", period)
		if cache != nil {
			if cached, ok := cache.Get(key); ok {
				_ = json.NewEncoder(w).Encode(cached.(collabResponse))
				return
			}
		}

		resp, err := computeTeamCollab(db, cfg, period)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if cache != nil {
			cache.SetWithTTL(key, resp, 0, collabCacheTTL)
		}
		_ = json.NewEncoder(w).Encode(resp)
	}
}

// computeTeamCollab runs the query + aggregation. Factored out for tests.
func computeTeamCollab(db *gorm.DB, cfg *teams.Config, period string) (collabResponse, error) {
	if db == nil {
		return collabResponse{}, fmt.Errorf("db is nil")
	}
	if cfg == nil {
		return collabResponse{}, fmt.Errorf("teams config is nil")
	}

	startTime := periodStart(period)

	type row struct {
		AuthorLogin   string `gorm:"column:author_login"`
		ReviewerLogin string `gorm:"column:reviewer_login"`
		Reviews       int    `gorm:"column:reviews"`
	}

	// Join reviews → pull_requests (to get PR author) → users for both sides.
	// Exclude self-reviews and the dependabot bot account.
	q := db.Table("reviews").
		Select(`author_users.login AS author_login,
		        reviewer_users.login AS reviewer_login,
		        COUNT(*) AS reviews`).
		Joins("JOIN pull_requests ON pull_requests.id = reviews.pull_request_id").
		Joins("JOIN users AS author_users ON author_users.id = pull_requests.author_id").
		Joins("JOIN users AS reviewer_users ON reviewer_users.id = reviews.author_id").
		Where("pull_requests.state = ?", "MERGED").
		Where("author_users.id <> reviewer_users.id").
		Where("LOWER(author_users.login) <> ?", collabBotLogin).
		Where("LOWER(reviewer_users.login) <> ?", collabBotLogin).
		Group("author_users.login, reviewer_users.login")
	if !startTime.IsZero() {
		q = q.Where("reviews.created_at >= ?", startTime)
	}

	var rows []row
	if err := q.Scan(&rows).Error; err != nil {
		return collabResponse{}, fmt.Errorf("team-collab query: %w", err)
	}

	// Build a case-insensitive login→team lookup once.
	loginToTeam := map[string]string{} // lowercased login -> slug
	teamSlugs := make([]string, 0, len(cfg.Teams))
	for _, t := range cfg.Teams {
		teamSlugs = append(teamSlugs, t.Slug)
		for _, m := range t.Members {
			loginToTeam[strings.ToLower(m)] = t.Slug
		}
	}
	sort.Strings(teamSlugs)

	// Aggregate into the matrix. `cells` is sparse — frontend densifies.
	type pairKey struct{ a, r string }
	matrix := map[pairKey]int{}
	outsiderByAuthor := map[string]int{}
	outsiderByReviewer := map[string]int{}
	for _, rr := range rows {
		aTeam, aOk := loginToTeam[strings.ToLower(rr.AuthorLogin)]
		rTeam, rOk := loginToTeam[strings.ToLower(rr.ReviewerLogin)]
		switch {
		case aOk && rOk:
			matrix[pairKey{a: aTeam, r: rTeam}] += rr.Reviews
		case aOk && !rOk:
			outsiderByAuthor[aTeam] += rr.Reviews
		case !aOk && rOk:
			outsiderByReviewer[rTeam] += rr.Reviews
		}
		// reviews where neither side is in any team — drop entirely.
	}

	cells := make([]collabRow, 0, len(matrix))
	for k, v := range matrix {
		cells = append(cells, collabRow{
			AuthorTeam:   k.a,
			ReviewerTeam: k.r,
			Reviews:      v,
		})
	}
	sort.Slice(cells, func(i, j int) bool {
		if cells[i].AuthorTeam != cells[j].AuthorTeam {
			return cells[i].AuthorTeam < cells[j].AuthorTeam
		}
		return cells[i].ReviewerTeam < cells[j].ReviewerTeam
	})

	// LastSyncedAt mirrors the convention from stats.go / team-stats.
	var lastSyncedAt *time.Time
	var status struct {
		ID           int       `gorm:"column:id;primaryKey"`
		LastSyncedAt time.Time `gorm:"column:last_synced_at"`
	}
	if err := db.Table("sync_statuses").First(&status, 1).Error; err == nil && !status.LastSyncedAt.IsZero() {
		ts := status.LastSyncedAt.UTC()
		lastSyncedAt = &ts
	}

	resp := collabResponse{
		SchemaVersion:                 collabSchemaVer,
		LastSyncedAt:                  lastSyncedAt,
		Period:                        period,
		Teams:                         teamSlugs,
		Cells:                         cells,
		OutsiderReviewsByAuthorTeam:   outsiderByAuthor,
		OutsiderReviewsByReviewerTeam: outsiderByReviewer,
	}
	return resp, nil
}
