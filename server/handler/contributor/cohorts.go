package contributor

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

const (
	cohortsCacheKey  = "contributors:cohorts:v1"
	cohortsCacheTTL  = 5 * time.Minute
	cohortsSchemaVer = 1
	// Cap the cohort window so the response stays bounded and the chart
	// stays legible. Cohorts older than this still count as "cohort 0"
	// in the global activity rollup but don't get their own row.
	cohortsLookbackMonths = 24
)

// CohortRow is one cohort's retention curve.
type CohortRow struct {
	// Month in `YYYY-MM` form — the month of each user's FIRST observed PR.
	Month string `json:"month"`
	// Number of distinct users whose first PR was in this month.
	Size int `json:"size"`
	// Fraction of the cohort that contributed (any PR) in each subsequent
	// month-offset. Index 0 = the cohort month itself (always 1.0).
	// Length grows up to the trailing month or `cohortsLookbackMonths`,
	// whichever is shorter.
	Retention []float64 `json:"retention"`
}

type cohortsResponse struct {
	SchemaVersion int         `json:"schemaVersion"`
	LastSyncedAt  *time.Time  `json:"lastSyncedAt"`
	GeneratedAt   time.Time   `json:"generatedAt"`
	Cohorts       []CohortRow `json:"cohorts"`
}

// HandleGetCohorts returns the retention curve for each monthly cohort of
// contributors, derived from the PR record. Cohort = month of a user's
// first observed PR. Retention point N = fraction of the cohort that had
// at least one PR in the Nth month after cohort.
//
// Plan §2 "contributor-cohort retention curve" lives in /gnolove/analytics.
// Cached 5 min via ristretto; no path params.
func HandleGetCohorts(db *gorm.DB, cache *ristretto.Cache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if cache != nil {
			if cached, ok := cache.Get(cohortsCacheKey); ok {
				_ = json.NewEncoder(w).Encode(cached.(cohortsResponse))
				return
			}
		}
		rows, lastSyncedAt, err := computeCohorts(db, time.Now().UTC(), cohortsLookbackMonths)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		resp := cohortsResponse{
			SchemaVersion: cohortsSchemaVer,
			LastSyncedAt:  lastSyncedAt,
			GeneratedAt:   time.Now().UTC(),
			Cohorts:       rows,
		}
		if cache != nil {
			cache.SetWithTTL(cohortsCacheKey, resp, 0, cohortsCacheTTL)
		}
		_ = json.NewEncoder(w).Encode(resp)
	}
}

// computeCohorts is the pure computation, factored out for tests.
//
// `now` pins the trailing-window edge so unit tests are reproducible.
// `lookback` caps how many cohort months get a row in the output (older
// cohorts are still folded into the global stats but not surfaced).
func computeCohorts(db *gorm.DB, now time.Time, lookback int) ([]CohortRow, *time.Time, error) {
	if db == nil {
		return nil, nil, fmt.Errorf("db is nil")
	}

	type prRow struct {
		AuthorID  string    `gorm:"column:author_id"`
		CreatedAt time.Time `gorm:"column:created_at"`
	}
	var prs []prRow
	if err := db.Model(&models.PullRequest{}).
		Select("author_id, created_at").
		Where("created_at IS NOT NULL AND author_id <> ''").
		Order("created_at ASC").
		Scan(&prs).Error; err != nil {
		return nil, nil, fmt.Errorf("cohorts: scan PRs: %w", err)
	}

	// Per-author first PR month (the cohort).
	firstMonth := make(map[string]string, len(prs))
	for _, p := range prs {
		month := p.CreatedAt.UTC().Format("2006-01")
		if _, seen := firstMonth[p.AuthorID]; !seen {
			firstMonth[p.AuthorID] = month
		}
	}

	// (cohort_month, month_offset) -> set of distinct author IDs active.
	active := map[string]map[int]map[string]struct{}{}
	cohortMembers := map[string]map[string]struct{}{}

	for _, p := range prs {
		cohort := firstMonth[p.AuthorID]
		month := p.CreatedAt.UTC().Format("2006-01")
		offset := monthDiff(cohort, month)
		if offset < 0 {
			continue
		}
		if cohortMembers[cohort] == nil {
			cohortMembers[cohort] = map[string]struct{}{}
		}
		cohortMembers[cohort][p.AuthorID] = struct{}{}
		if active[cohort] == nil {
			active[cohort] = map[int]map[string]struct{}{}
		}
		if active[cohort][offset] == nil {
			active[cohort][offset] = map[string]struct{}{}
		}
		active[cohort][offset][p.AuthorID] = struct{}{}
	}

	// Only emit cohorts within the lookback window so the chart stays legible.
	earliestCohort := now.AddDate(0, -lookback, 0).Format("2006-01")
	nowMonth := now.Format("2006-01")

	cohortMonths := make([]string, 0, len(cohortMembers))
	for c := range cohortMembers {
		if c >= earliestCohort {
			cohortMonths = append(cohortMonths, c)
		}
	}
	sort.Strings(cohortMonths)

	rows := make([]CohortRow, 0, len(cohortMonths))
	for _, c := range cohortMonths {
		size := len(cohortMembers[c])
		if size == 0 {
			continue
		}
		maxOffset := monthDiff(c, nowMonth)
		retention := make([]float64, 0, maxOffset+1)
		for offset := 0; offset <= maxOffset; offset++ {
			count := 0
			if bucket, ok := active[c][offset]; ok {
				count = len(bucket)
			}
			retention = append(retention, float64(count)/float64(size))
		}
		rows = append(rows, CohortRow{Month: c, Size: size, Retention: retention})
	}

	// LastSyncedAt from the global sync_status row, mirroring stats.go.
	var lastSyncedAt *time.Time
	var status models.SyncStatus
	if err := db.First(&status, 1).Error; err == nil && !status.LastSyncedAt.IsZero() {
		ts := status.LastSyncedAt.UTC()
		lastSyncedAt = &ts
	}

	return rows, lastSyncedAt, nil
}

// monthDiff returns (b.year*12+b.month) - (a.year*12+a.month) given two
// `YYYY-MM` strings. Returns 0 on parse failure to avoid silent skews.
func monthDiff(aMonth, bMonth string) int {
	a, err := time.Parse("2006-01", aMonth)
	if err != nil {
		return 0
	}
	b, err := time.Parse("2006-01", bMonth)
	if err != nil {
		return 0
	}
	return (b.Year()-a.Year())*12 + int(b.Month()-a.Month())
}
