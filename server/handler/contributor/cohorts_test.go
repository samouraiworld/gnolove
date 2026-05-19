package contributor

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.PullRequest{}, &models.SyncStatus{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func seedPR(t *testing.T, db *gorm.DB, prID, authorID string, createdAt time.Time) {
	t.Helper()
	pr := models.PullRequest{
		ID:        prID,
		AuthorID:  authorID,
		CreatedAt: createdAt,
		State:     "MERGED",
	}
	if err := db.Create(&pr).Error; err != nil {
		t.Fatalf("seed pr: %v", err)
	}
}

func TestMonthDiff(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{
		{"2026-01", "2026-01", 0},
		{"2026-01", "2026-02", 1},
		{"2026-01", "2027-01", 12},
		{"2025-12", "2026-01", 1},
		{"2026-03", "2026-01", -2},
	}
	for _, c := range cases {
		if got := monthDiff(c.a, c.b); got != c.want {
			t.Errorf("monthDiff(%q,%q) = %d, want %d", c.a, c.b, got, c.want)
		}
	}
}

func TestComputeCohorts_Basics(t *testing.T) {
	db := newTestDB(t)
	mk := func(s string) time.Time {
		ts, err := time.Parse("2006-01-02", s)
		if err != nil {
			t.Fatalf("parse %q: %v", s, err)
		}
		return ts.UTC()
	}

	// alice: first PR 2026-01, then active 2026-02 + 2026-03
	for i, d := range []string{"2026-01-15", "2026-02-10", "2026-03-05"} {
		seedPR(t, db, fmt.Sprintf("alice-%d", i), "alice", mk(d))
	}
	// bob: first PR 2026-01 — cohort partner. Active only 2026-01.
	seedPR(t, db, "bob-0", "bob", mk("2026-01-20"))
	// carol: first PR 2026-02 — new cohort. Active 2026-02 + 2026-03.
	seedPR(t, db, "carol-0", "carol", mk("2026-02-12"))
	seedPR(t, db, "carol-1", "carol", mk("2026-03-19"))

	rows, _, err := computeCohorts(db, mk("2026-03-31"), 24)
	if err != nil {
		t.Fatalf("computeCohorts: %v", err)
	}
	byMonth := map[string]CohortRow{}
	for _, r := range rows {
		byMonth[r.Month] = r
	}

	jan := byMonth["2026-01"]
	if jan.Size != 2 {
		t.Errorf("Jan cohort size = %d, want 2 (alice + bob)", jan.Size)
	}
	if len(jan.Retention) != 3 {
		t.Fatalf("Jan retention len = %d, want 3 (Jan, Feb, Mar)", len(jan.Retention))
	}
	if jan.Retention[0] != 1.0 {
		t.Errorf("Jan retention[0] = %v, want 1.0", jan.Retention[0])
	}
	// Feb activity for Jan cohort: alice contributed → 1/2 = 0.5
	if jan.Retention[1] != 0.5 {
		t.Errorf("Jan retention[1] = %v, want 0.5", jan.Retention[1])
	}
	// Mar activity for Jan cohort: alice only → 0.5
	if jan.Retention[2] != 0.5 {
		t.Errorf("Jan retention[2] = %v, want 0.5", jan.Retention[2])
	}

	feb := byMonth["2026-02"]
	if feb.Size != 1 {
		t.Errorf("Feb cohort size = %d, want 1 (carol)", feb.Size)
	}
	if len(feb.Retention) != 2 || feb.Retention[0] != 1.0 || feb.Retention[1] != 1.0 {
		t.Errorf("Feb retention = %+v, want [1, 1]", feb.Retention)
	}
}

func TestComputeCohorts_LookbackTrimsOldCohorts(t *testing.T) {
	db := newTestDB(t)
	old := time.Date(2023, 1, 5, 0, 0, 0, 0, time.UTC)
	recent := time.Date(2026, 4, 5, 0, 0, 0, 0, time.UTC)

	seedPR(t, db, "old-0", "veteran", old)
	seedPR(t, db, "old-1", "veteran", recent) // still active recently
	seedPR(t, db, "new-0", "rookie", recent)

	// 6-month lookback: 2023-01 must be dropped, 2026-04 must stay.
	rows, _, err := computeCohorts(db, time.Date(2026, 4, 30, 0, 0, 0, 0, time.UTC), 6)
	if err != nil {
		t.Fatalf("computeCohorts: %v", err)
	}
	for _, r := range rows {
		if r.Month == "2023-01" {
			t.Errorf("veteran 2023-01 cohort should be trimmed by lookback=6, got %+v", r)
		}
	}
	found := false
	for _, r := range rows {
		if r.Month == "2026-04" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("rookie 2026-04 cohort should be present, got rows = %+v", rows)
	}
}

func TestHandleGetCohorts_RespectsCache(t *testing.T) {
	db := newTestDB(t)
	cache, _ := ristretto.NewCache(&ristretto.Config{NumCounters: 1000, MaxCost: 1 << 20, BufferItems: 64})

	seedPR(t, db, "p-0", "alice", time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC))

	h := HandleGetCohorts(db, cache)

	rec1 := httptest.NewRecorder()
	h.ServeHTTP(rec1, httptest.NewRequest(http.MethodGet, "/contributors/cohorts", nil))
	if rec1.Code != http.StatusOK {
		t.Fatalf("first status = %d, body = %s", rec1.Code, rec1.Body.String())
	}
	cache.Wait()

	// Mutate DB; second call should hit cache → identical body.
	seedPR(t, db, "p-1", "bob", time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC))

	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, httptest.NewRequest(http.MethodGet, "/contributors/cohorts", nil))
	if rec1.Body.String() != rec2.Body.String() {
		t.Errorf("cache miss\n1: %s\n2: %s", rec1.Body, rec2.Body)
	}

	// Verify the response shape is what frontend will expect.
	var body cohortsResponse
	if err := json.Unmarshal(rec1.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.SchemaVersion != cohortsSchemaVer {
		t.Errorf("schemaVersion = %d, want %d", body.SchemaVersion, cohortsSchemaVer)
	}
}
