package teams

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/go-chi/chi/v5"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/teams"
	"gorm.io/gorm"
)

const teamStatsCacheTTL = 5 * time.Minute

// TeamStatRow is one (repo, author) cell of the GROUP BY result.
type TeamStatRow struct {
	RepoID    string `gorm:"column:repo_id"    json:"repoId"`
	AuthorID  string `gorm:"column:author_id"  json:"authorId"`
	Login     string `gorm:"column:login"      json:"login"`
	MergedPRs int    `gorm:"column:merged_prs" json:"mergedPRs"`
}

// TeamStatsTotals is the precomputed roll-up so the frontend doesn't need
// to sum on every render.
type TeamStatsTotals struct {
	MergedPRs          int `json:"mergedPRs"`
	ActiveContributors int `json:"activeContributors"`
	ActiveRepos        int `json:"activeRepos"`
}

type teamStatsResponse struct {
	SchemaVersion int             `json:"schemaVersion"`
	LastSyncedAt  *time.Time      `json:"lastSyncedAt"`
	Slug          string          `json:"slug"`
	Period        string          `json:"period"`
	Repos         []string        `json:"repos"`
	Stats         []TeamStatRow   `json:"stats"`
	Totals        TeamStatsTotals `json:"totals"`
}

// HandleGetTeamStats returns merged-PR counts grouped by (repository_id,
// author_id) for one team in one period. 5-minute ristretto cache.
func HandleGetTeamStats(db *gorm.DB, cfg *teams.Config, cache *ristretto.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		slug := chi.URLParam(r, "slug")
		team, ok := cfg.FindBySlug(slug)
		if !ok {
			http.Error(w, fmt.Sprintf("team %q not found", slug), http.StatusNotFound)
			return
		}
		period := r.URL.Query().Get("time")
		repos := r.URL.Query()["repos"]
		key := fmt.Sprintf("teams:stats:%s:%s:%s", strings.ToLower(team.Slug), period, strings.Join(repos, ","))
		if cache != nil {
			if cached, ok := cache.Get(key); ok {
				_ = json.NewEncoder(w).Encode(cached.(teamStatsResponse))
				return
			}
		}
		stats, lastSyncedAt, err := queryTeamStats(db, team.Members, periodStart(period), repos)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		resp := teamStatsResponse{
			SchemaVersion: cfg.SchemaVersion,
			LastSyncedAt:  lastSyncedAt,
			Slug:          team.Slug,
			Period:        period,
			Repos:         repos,
			Stats:         stats,
			Totals:        rollUp(stats),
		}
		if cache != nil {
			cache.SetWithTTL(key, resp, 0, teamStatsCacheTTL)
		}
		_ = json.NewEncoder(w).Encode(resp)
	}
}

// queryTeamStats runs the single GROUP BY query the plan calls for:
//
//	SELECT repository_id, author_id, users.login, COUNT(*) AS merged_prs
//	FROM pull_requests
//	JOIN users ON users.id = pull_requests.author_id
//	WHERE state = 'MERGED'
//	  AND LOWER(users.login) IN (...members)
//	  [AND merged_at >= startTime]
//	  [AND repository_id IN (...repos)]
//	GROUP BY repository_id, author_id, users.login
//	ORDER BY merged_prs DESC
func queryTeamStats(db *gorm.DB, members []string, startTime time.Time, repos []string) ([]TeamStatRow, *time.Time, error) {
	lowered := make([]string, len(members))
	for i, m := range members {
		lowered[i] = strings.ToLower(m)
	}
	q := db.Model(&models.PullRequest{}).
		Select("pull_requests.repository_id AS repo_id, pull_requests.author_id AS author_id, users.login AS login, COUNT(*) AS merged_prs").
		Joins("JOIN users ON users.id = pull_requests.author_id").
		Where("pull_requests.state = ?", "MERGED").
		Where("LOWER(users.login) IN ?", lowered).
		Group("pull_requests.repository_id, pull_requests.author_id, users.login").
		Order("merged_prs DESC")
	if !startTime.IsZero() {
		q = q.Where("pull_requests.merged_at >= ?", startTime)
	}
	if len(repos) > 0 {
		q = q.Where("pull_requests.repository_id IN ?", repos)
	}
	var rows []TeamStatRow
	if err := q.Scan(&rows).Error; err != nil {
		return nil, nil, fmt.Errorf("team-stats query: %w", err)
	}

	var lastSyncedAt *time.Time
	var syncStatus models.SyncStatus
	if err := db.First(&syncStatus, 1).Error; err == nil && !syncStatus.LastSyncedAt.IsZero() {
		ts := syncStatus.LastSyncedAt.UTC()
		lastSyncedAt = &ts
	}
	return rows, lastSyncedAt, nil
}

func rollUp(rows []TeamStatRow) TeamStatsTotals {
	authors := map[string]struct{}{}
	repos := map[string]struct{}{}
	total := 0
	for _, r := range rows {
		total += r.MergedPRs
		authors[r.AuthorID] = struct{}{}
		repos[r.RepoID] = struct{}{}
	}
	return TeamStatsTotals{
		MergedPRs:          total,
		ActiveContributors: len(authors),
		ActiveRepos:        len(repos),
	}
}
