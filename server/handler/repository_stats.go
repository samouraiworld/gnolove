package handler

import (
	"encoding/json"
	"github.com/dgraph-io/ristretto"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
	"net/http"
	"strings"
	"time"
)

type RepositoryStats struct {
	RepositoryID string              `json:"repositoryId"`
	MergedPRs    int                 `json:"mergedPRs"`
	OpenPRs      int                 `json:"openPRs"`
	Contributors int                 `json:"contributors"`
	LastMergedPR *models.PullRequest `json:"lastMergedPR,omitempty"`
}

type repositoryStatsResponse struct {
	Time         string            `json:"time"`
	Repositories []RepositoryStats `json:"repositories"`
}

func HandleGetRepositoryStats(db *gorm.DB, cache *ristretto.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		period := r.URL.Query().Get("time")
		start := time.Time{}
		switch period {
		case "", "all":
			period = "all"
		case "weekly":
			start = time.Now().UTC().AddDate(0, 0, -7)
		case "monthly":
			start = time.Now().UTC().AddDate(0, -1, 0)
		case "yearly":
			start = time.Now().UTC().AddDate(-1, 0, 0)
		default:
			http.Error(w, "Unsupported period", http.StatusBadRequest)
			return
		}
		repos, err := models.PublicRepositories(db)
		if err != nil {
			http.Error(w, "Repository statistics unavailable", http.StatusServiceUnavailable)
			return
		}
		ids := []string{}
		for _, repo := range repos {
			ids = append(ids, repo.ID)
		}
		key := "repository-stats:" + period + ":" + strings.Join(ids, ",")
		w.Header().Set("Content-Type", "application/json")
		if cache != nil {
			if cached, ok := cache.Get(key); ok {
				json.NewEncoder(w).Encode(cached)
				return
			}
		}
		out := repositoryStatsResponse{Time: period, Repositories: []RepositoryStats{}}
		if len(ids) > 0 {
			type count struct {
				RepositoryID string
				Total        int
			}
			merged, opened, contributors := []count{}, []count{}, []count{}
			if err := db.Model(&models.PullRequest{}).Select("repository_id, COUNT(*) AS total").Where("repository_id IN ? AND state = ? AND merged_at >= ?", ids, "MERGED", start).Group("repository_id").Scan(&merged).Error; err != nil {
				http.Error(w, "Repository statistics unavailable", 503)
				return
			}
			if err := db.Model(&models.PullRequest{}).Select("repository_id, COUNT(*) AS total").Where("repository_id IN ? AND state = ?", ids, "OPEN").Group("repository_id").Scan(&opened).Error; err != nil {
				http.Error(w, "Repository statistics unavailable", 503)
				return
			}
			// Distinct authors of commits, PRs, reviews or issues created in this period.
			sql := `SELECT repository_id, COUNT(*) AS total FROM (
    SELECT repository_id, author_id FROM commits WHERE created_at >= ? AND repository_id IN ?
    UNION SELECT repository_id, author_id FROM pull_requests WHERE created_at >= ? AND repository_id IN ?
    UNION SELECT repository_id, author_id FROM reviews WHERE created_at >= ? AND repository_id IN ?
    UNION SELECT repository_id, author_id FROM issues WHERE created_at >= ? AND repository_id IN ?
   ) WHERE author_id != '' GROUP BY repository_id`
			if err := db.Raw(sql, start, ids, start, ids, start, ids, start, ids).Scan(&contributors).Error; err != nil {
				http.Error(w, "Repository statistics unavailable", 503)
				return
			}
			byID := map[string]*RepositoryStats{}
			for _, id := range ids {
				byID[id] = &RepositoryStats{RepositoryID: id}
			}
			for _, c := range merged {
				byID[c.RepositoryID].MergedPRs = c.Total
			}
			for _, c := range opened {
				byID[c.RepositoryID].OpenPRs = c.Total
			}
			for _, c := range contributors {
				byID[c.RepositoryID].Contributors = c.Total
			}
			latest := []models.PullRequest{}
			if err := db.Raw(`SELECT * FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY repository_id ORDER BY merged_at DESC, id) AS rank FROM pull_requests WHERE repository_id IN ? AND state = 'MERGED' AND merged_at >= ?) WHERE rank = 1`, ids, start).Scan(&latest).Error; err != nil {
				http.Error(w, "Repository statistics unavailable", 503)
				return
			}
			for i := range latest {
				byID[latest[i].RepositoryID].LastMergedPR = &latest[i]
			}
			for _, id := range ids {
				out.Repositories = append(out.Repositories, *byID[id])
			}
		}
		if cache != nil {
			cache.SetWithTTL(key, out, 1, 5*time.Minute)
		}
		json.NewEncoder(w).Encode(out)
	}
}
