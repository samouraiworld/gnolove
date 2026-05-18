package teams

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/go-chi/chi/v5"
)

func TestHandleGetTeamStats_GroupByRepoAndAuthor(t *testing.T) {
	db := newTestDB(t)
	cfg := fixtureConfig()
	cache, _ := ristretto.NewCache(&ristretto.Config{NumCounters: 1000, MaxCost: 1 << 20, BufferItems: 64})

	notJoon := seedUser(t, db, "notJoon")
	r3v4s := seedUser(t, db, "r3v4s")
	outsider := seedUser(t, db, "outsider")
	mergedAt := time.Now().UTC().Add(-time.Hour)

	for range 3 {
		seedMergedPR(t, db, "gnolang/gno", notJoon, mergedAt)
	}
	for range 5 {
		seedMergedPR(t, db, "onbloc/gnoscan", r3v4s, mergedAt)
	}
	seedMergedPR(t, db, "gnolang/gno", r3v4s, mergedAt)
	for range 10 {
		seedMergedPR(t, db, "gnolang/gno", outsider, mergedAt) // outside the team — must be filtered out
	}

	r := chi.NewRouter()
	r.Get("/teams/{slug}/team-stats", HandleGetTeamStats(db, cfg, cache))

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/teams/onbloc/team-stats", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d body=%s", rec.Code, rec.Body.String())
	}
	var got teamStatsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	// Three rows: (gno, notJoon, 3), (gnoscan, r3v4s, 5), (gno, r3v4s, 1).
	if len(got.Stats) != 3 {
		t.Fatalf("rows = %d (%+v), want 3", len(got.Stats), got.Stats)
	}
	if got.Totals.MergedPRs != 9 {
		t.Errorf("totals.mergedPRs = %d, want 9", got.Totals.MergedPRs)
	}
	if got.Totals.ActiveContributors != 2 {
		t.Errorf("totals.activeContributors = %d, want 2", got.Totals.ActiveContributors)
	}
	if got.Totals.ActiveRepos != 2 {
		t.Errorf("totals.activeRepos = %d, want 2", got.Totals.ActiveRepos)
	}

	// Rows are sorted DESC by mergedPRs.
	if got.Stats[0].MergedPRs < got.Stats[len(got.Stats)-1].MergedPRs {
		t.Errorf("rows not sorted desc: %+v", got.Stats)
	}
}

func TestHandleGetTeamStats_RepoFilter(t *testing.T) {
	db := newTestDB(t)
	cfg := fixtureConfig()

	notJoon := seedUser(t, db, "notJoon")
	mergedAt := time.Now().UTC().Add(-time.Hour)
	seedMergedPR(t, db, "gnolang/gno", notJoon, mergedAt)
	seedMergedPR(t, db, "onbloc/gnoscan", notJoon, mergedAt)

	r := chi.NewRouter()
	r.Get("/teams/{slug}/team-stats", HandleGetTeamStats(db, cfg, nil))

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/teams/onbloc/team-stats?repos=onbloc/gnoscan", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	var got teamStatsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(got.Stats) != 1 || got.Stats[0].RepoID != "onbloc/gnoscan" {
		t.Errorf("repo filter ignored: %+v", got.Stats)
	}
}

func TestHandleGetTeamStats_CachesResponse(t *testing.T) {
	db := newTestDB(t)
	cfg := fixtureConfig()
	cache, _ := ristretto.NewCache(&ristretto.Config{NumCounters: 1000, MaxCost: 1 << 20, BufferItems: 64})

	notJoon := seedUser(t, db, "notJoon")
	seedMergedPR(t, db, "gnolang/gno", notJoon, time.Now().UTC().Add(-time.Hour))

	r := chi.NewRouter()
	r.Get("/teams/{slug}/team-stats", HandleGetTeamStats(db, cfg, cache))

	rec1 := httptest.NewRecorder()
	r.ServeHTTP(rec1, httptest.NewRequest(http.MethodGet, "/teams/onbloc/team-stats", nil))
	if rec1.Code != http.StatusOK {
		t.Fatalf("first call status = %d", rec1.Code)
	}
	cache.Wait()
	// Bust the DB so a cache miss would change the response.
	seedMergedPR(t, db, "gnolang/gno", notJoon, time.Now().UTC().Add(-time.Hour))

	rec2 := httptest.NewRecorder()
	r.ServeHTTP(rec2, httptest.NewRequest(http.MethodGet, "/teams/onbloc/team-stats", nil))
	if rec1.Body.String() != rec2.Body.String() {
		t.Errorf("cache miss: %s vs %s", rec1.Body, rec2.Body)
	}
}

func TestHandleGetTeamStats_UnknownSlug(t *testing.T) {
	db := newTestDB(t)
	cfg := fixtureConfig()
	r := chi.NewRouter()
	r.Get("/teams/{slug}/team-stats", HandleGetTeamStats(db, cfg, nil))
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/teams/missing/team-stats", nil))
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}
