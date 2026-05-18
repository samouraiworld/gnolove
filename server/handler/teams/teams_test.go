package teams

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/go-chi/chi/v5"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/teams"
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

func seedUser(t *testing.T, db *gorm.DB, login string) string {
	t.Helper()
	id := "u-" + login
	u := models.User{ID: id, Login: login}
	if err := db.Create(&u).Error; err != nil {
		t.Fatalf("seed user %q: %v", login, err)
	}
	return id
}

var prSeq int

func seedMergedPR(t *testing.T, db *gorm.DB, repoID, authorID string, mergedAt time.Time) {
	t.Helper()
	prSeq++
	pr := models.PullRequest{
		ID:           fmt.Sprintf("pr-%d", prSeq),
		RepositoryID: repoID,
		State:        "MERGED",
		AuthorID:     authorID,
		MergedAt:     &mergedAt,
		CreatedAt:    mergedAt.Add(-24 * time.Hour),
	}
	if err := db.Create(&pr).Error; err != nil {
		t.Fatalf("seed pr: %v", err)
	}
}

func fixtureConfig() *teams.Config {
	return &teams.Config{
		SchemaVersion: 1,
		LastSyncedAt:  time.Date(2026, 5, 18, 12, 0, 0, 0, time.UTC),
		Teams: []teams.Team{
			{Slug: "onbloc", Name: "Onbloc", Color: "purple", Members: []string{"notJoon", "r3v4s"}},
			{Slug: "samouraiworld", Name: "Samourai.world", Color: "red", Members: []string{"n0izn0iz", "zxxma"}},
		},
	}
}

func TestHandleGetAll(t *testing.T) {
	cfg := fixtureConfig()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/teams", nil)
	HandleGetAll(cfg).ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var got teamsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if got.SchemaVersion != 1 {
		t.Errorf("schemaVersion = %d, want 1", got.SchemaVersion)
	}
	if got.LastSyncedAt.IsZero() {
		t.Error("lastSyncedAt must be non-zero")
	}
	if len(got.Teams) != 2 {
		t.Errorf("teams = %d, want 2", len(got.Teams))
	}
}

func TestHandleGetBySlug_FoundAndNotFound(t *testing.T) {
	cfg := fixtureConfig()
	r := chi.NewRouter()
	r.Get("/teams/{slug}", HandleGetBySlug(cfg))

	t.Run("hit", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/teams/ONBLOC", nil) // case-insensitive
		r.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		var got teamResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if got.Team.Slug != "onbloc" {
			t.Errorf("slug = %q, want onbloc", got.Team.Slug)
		}
	})
	t.Run("miss", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/teams/missing", nil)
		r.ServeHTTP(rec, req)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want 404", rec.Code)
		}
	})
}

func TestHandleGetActiveRepos_DualThresholdEnd2End(t *testing.T) {
	db := newTestDB(t)
	cfg := fixtureConfig()
	cache, _ := ristretto.NewCache(&ristretto.Config{NumCounters: 1000, MaxCost: 1 << 20, BufferItems: 64})

	// Onbloc members are notJoon + r3v4s. Seed:
	//   - gnolang/gno    : team = 10, total = 100  → primary
	//   - onbloc/gnoscan : team = 50, total =  60  → primary
	//   - other/repo     : team =  1, total = 200  → secondary (below repo-share)
	notJoon := seedUser(t, db, "notJoon")
	r3v4s := seedUser(t, db, "r3v4s")
	outsider := seedUser(t, db, "outsider")
	mergedAt := time.Now().UTC().Add(-time.Hour)

	for range 10 {
		seedMergedPR(t, db, "gnolang/gno", notJoon, mergedAt)
	}
	for range 90 {
		seedMergedPR(t, db, "gnolang/gno", outsider, mergedAt)
	}
	for range 50 {
		seedMergedPR(t, db, "onbloc/gnoscan", r3v4s, mergedAt)
	}
	for range 10 {
		seedMergedPR(t, db, "onbloc/gnoscan", outsider, mergedAt)
	}
	seedMergedPR(t, db, "other/repo", notJoon, mergedAt)
	for range 199 {
		seedMergedPR(t, db, "other/repo", outsider, mergedAt)
	}

	r := chi.NewRouter()
	r.Get("/teams/{slug}/active-repos", HandleGetActiveRepos(db, cfg, cache))

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/teams/onbloc/active-repos", nil)
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d body=%s", rec.Code, rec.Body.String())
	}
	var got activeReposResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if got.SchemaVersion != 1 {
		t.Errorf("schemaVersion = %d, want 1", got.SchemaVersion)
	}
	if got.Slug != "onbloc" {
		t.Errorf("slug = %q, want onbloc", got.Slug)
	}

	primaryIDs := map[string]int{}
	for _, p := range got.Primary {
		primaryIDs[p.RepoID] = p.TeamPRs
	}
	if primaryIDs["onbloc/gnoscan"] != 50 || primaryIDs["gnolang/gno"] != 10 {
		t.Errorf("primary = %+v, want gnoscan=50 + gno=10", primaryIDs)
	}

	foundSecondary := false
	for _, s := range got.Secondary {
		if s.RepoID == "other/repo" && s.TeamPRs == 1 {
			foundSecondary = true
		}
	}
	if !foundSecondary {
		t.Errorf("secondary missing other/repo: %+v", got.Secondary)
	}
}

func TestHandleGetActiveRepos_CachesResponse(t *testing.T) {
	db := newTestDB(t)
	cfg := fixtureConfig()
	cache, _ := ristretto.NewCache(&ristretto.Config{NumCounters: 1000, MaxCost: 1 << 20, BufferItems: 64})

	notJoon := seedUser(t, db, "notJoon")
	seedMergedPR(t, db, "gnolang/gno", notJoon, time.Now().UTC().Add(-time.Hour))

	r := chi.NewRouter()
	r.Get("/teams/{slug}/active-repos", HandleGetActiveRepos(db, cfg, cache))

	rec1 := httptest.NewRecorder()
	r.ServeHTTP(rec1, httptest.NewRequest(http.MethodGet, "/teams/onbloc/active-repos", nil))
	if rec1.Code != http.StatusOK {
		t.Fatalf("first call status = %d", rec1.Code)
	}
	// ristretto is async — wait for the Set to flush so the second call hits cache.
	cache.Wait()

	// Mutate the DB. If the second call doesn't hit the cache, results would shift.
	seedMergedPR(t, db, "gnolang/gno", notJoon, time.Now().UTC().Add(-time.Hour))

	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, httptest.NewRequest(http.MethodGet, "/teams/onbloc/active-repos", nil))
	if rec2.Code != http.StatusOK {
		t.Fatalf("second call status = %d", rec2.Code)
	}
	if rec1.Body.String() != rec2.Body.String() {
		t.Errorf("cache miss: response changed between calls\n1: %s\n2: %s", rec1.Body, rec2.Body)
	}
}

func TestHandleGetActiveRepos_UnknownSlug(t *testing.T) {
	db := newTestDB(t)
	cfg := fixtureConfig()
	r := chi.NewRouter()
	r.Get("/teams/{slug}/active-repos", HandleGetActiveRepos(db, cfg, nil))
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/teams/missing/active-repos", nil))
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}
