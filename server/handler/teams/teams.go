// Package teams wires the /teams family of endpoints (Phase 1).
package teams

import (
	"encoding/json"
	"errors"
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

// activeReposCacheTTL is the ristretto TTL for /teams/:slug/active-repos.
// Five minutes is the same window we use for /stats — keeps the team hub
// fresh enough during EU business hours without re-running aggregations
// on every page hop.
const activeReposCacheTTL = 5 * time.Minute

type teamsResponse struct {
	SchemaVersion int          `json:"schemaVersion"`
	LastSyncedAt  time.Time    `json:"lastSyncedAt"`
	Teams         []teams.Team `json:"teams"`
}

type teamResponse struct {
	SchemaVersion int        `json:"schemaVersion"`
	LastSyncedAt  time.Time  `json:"lastSyncedAt"`
	Team          teams.Team `json:"team"`
}

type activeReposResponse struct {
	SchemaVersion int                `json:"schemaVersion"`
	LastSyncedAt  *time.Time         `json:"lastSyncedAt"`
	Slug          string             `json:"slug"`
	Period        string             `json:"period"`
	Primary       []teams.ActiveRepo `json:"primary"`
	Secondary     []teams.ActiveRepo `json:"secondary"`
}

// HandleGetAll returns the full roster + schemaVersion + lastSyncedAt.
func HandleGetAll(cfg *teams.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(teamsResponse{
			SchemaVersion: cfg.SchemaVersion,
			LastSyncedAt:  cfg.LastSyncedAt,
			Teams:         cfg.Teams,
		})
	}
}

// HandleGetBySlug returns a single team or 404.
func HandleGetBySlug(cfg *teams.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		slug := chi.URLParam(r, "slug")
		team, ok := cfg.FindBySlug(slug)
		if !ok {
			http.Error(w, fmt.Sprintf("team %q not found", slug), http.StatusNotFound)
			return
		}
		_ = json.NewEncoder(w).Encode(teamResponse{
			SchemaVersion: cfg.SchemaVersion,
			LastSyncedAt:  cfg.LastSyncedAt,
			Team:          team,
		})
	}
}

// HandleGetActiveRepos returns Primary/Secondary repos for a team using the
// dual-threshold rule. Cached 5 minutes per (slug, period).
func HandleGetActiveRepos(db *gorm.DB, cfg *teams.Config, cache *ristretto.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		slug := chi.URLParam(r, "slug")
		team, ok := cfg.FindBySlug(slug)
		if !ok {
			http.Error(w, fmt.Sprintf("team %q not found", slug), http.StatusNotFound)
			return
		}
		period := r.URL.Query().Get("time")
		key := fmt.Sprintf("teams:active-repos:%s:%s", strings.ToLower(team.Slug), period)
		if cache != nil {
			if cached, ok := cache.Get(key); ok {
				_ = json.NewEncoder(w).Encode(cached.(activeReposResponse))
				return
			}
		}
		startTime := periodStart(period)
		teamPRs, repoTotals, lastSyncedAt, err := AggregatePRs(db, team.Members, startTime)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		result := teams.ComputeActiveRepos(teamPRs, repoTotals)
		resp := activeReposResponse{
			SchemaVersion: cfg.SchemaVersion,
			LastSyncedAt:  lastSyncedAt,
			Slug:          team.Slug,
			Period:        period,
			Primary:       result.Primary,
			Secondary:     result.Secondary,
		}
		if cache != nil {
			cache.SetWithTTL(key, resp, 0, activeReposCacheTTL)
		}
		_ = json.NewEncoder(w).Encode(resp)
	}
}

func periodStart(period string) time.Time {
	now := time.Now().UTC()
	switch period {
	case "daily":
		return now.AddDate(0, 0, -1)
	case "weekly":
		return now.AddDate(0, 0, -7)
	case "monthly":
		return now.AddDate(0, -1, 0)
	case "yearly":
		return now.AddDate(-1, 0, 0)
	default:
		return time.Time{} // all-time
	}
}

// AggregatePRs returns:
//   - teamPRs   : map[repoID]merged-PR-count by members (case-insensitive match on users.login)
//   - repoTotals: map[repoID]merged-PR-count across all authors
//   - lastSyncedAt: from the global sync_status row (nil if unset)
//
// Exposed for the team-stats handler (Commit 3) to reuse the team filter.
func AggregatePRs(db *gorm.DB, members []string, startTime time.Time) (map[string]int, map[string]int, *time.Time, error) {
	if db == nil {
		return nil, nil, nil, errors.New("db is nil")
	}
	lowered := make([]string, len(members))
	for i, m := range members {
		lowered[i] = strings.ToLower(m)
	}

	type row struct {
		RepositoryID string
		Cnt          int
	}

	teamQuery := db.Model(&models.PullRequest{}).
		Select("repository_id, COUNT(*) AS cnt").
		Joins("JOIN users ON users.id = pull_requests.author_id").
		Where("pull_requests.state = ?", "MERGED").
		Where("LOWER(users.login) IN ?", lowered).
		Group("repository_id")
	if !startTime.IsZero() {
		teamQuery = teamQuery.Where("pull_requests.merged_at >= ?", startTime)
	}
	var teamRows []row
	if err := teamQuery.Scan(&teamRows).Error; err != nil {
		return nil, nil, nil, fmt.Errorf("team-prs query: %w", err)
	}
	teamPRs := make(map[string]int, len(teamRows))
	for _, r := range teamRows {
		teamPRs[r.RepositoryID] = r.Cnt
	}

	totalsQuery := db.Model(&models.PullRequest{}).
		Select("repository_id, COUNT(*) AS cnt").
		Where("state = ?", "MERGED").
		Group("repository_id")
	if !startTime.IsZero() {
		totalsQuery = totalsQuery.Where("merged_at >= ?", startTime)
	}
	var totalRows []row
	if err := totalsQuery.Scan(&totalRows).Error; err != nil {
		return nil, nil, nil, fmt.Errorf("repo-totals query: %w", err)
	}
	repoTotals := make(map[string]int, len(totalRows))
	for _, r := range totalRows {
		repoTotals[r.RepositoryID] = r.Cnt
	}

	var syncStatus models.SyncStatus
	var lastSyncedAt *time.Time
	if err := db.First(&syncStatus, 1).Error; err == nil && !syncStatus.LastSyncedAt.IsZero() {
		ts := syncStatus.LastSyncedAt.UTC()
		lastSyncedAt = &ts
	}
	return teamPRs, repoTotals, lastSyncedAt, nil
}
