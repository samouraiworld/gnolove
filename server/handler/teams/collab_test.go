package teams

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

// seedReview attaches a Review row to an existing PR (created via seedMergedPR).
// Returns the review ID so callers can assert if needed.
func seedReview(t *testing.T, db *gorm.DB, prID, reviewerUserID, repoID string, createdAt time.Time) string {
	t.Helper()
	id := fmt.Sprintf("rv-%s-%s-%d", prID, reviewerUserID, createdAt.UnixNano())
	rv := models.Review{
		ID:            id,
		PullRequestID: prID,
		AuthorID:      reviewerUserID,
		RepositoryID:  repoID,
		CreatedAt:     createdAt,
	}
	if err := db.Create(&rv).Error; err != nil {
		t.Fatalf("seed review: %v", err)
	}
	return id
}

// seedMergedPRReturnID is like seedMergedPR but returns the PR ID so a
// review can target it. seedMergedPR uses a private prSeq counter so we
// can rebuild the same id by predicting the next value.
func seedMergedPRReturnID(t *testing.T, db *gorm.DB, repoID, authorID string, mergedAt time.Time) string {
	t.Helper()
	prSeq++
	id := fmt.Sprintf("pr-%d", prSeq)
	pr := models.PullRequest{
		ID:           id,
		RepositoryID: repoID,
		State:        "MERGED",
		AuthorID:     authorID,
		MergedAt:     &mergedAt,
		CreatedAt:    mergedAt.Add(-24 * time.Hour),
	}
	if err := db.Create(&pr).Error; err != nil {
		t.Fatalf("seed pr: %v", err)
	}
	return id
}

func TestComputeTeamCollab_Basics(t *testing.T) {
	db := newTestDB(t)
	if err := db.AutoMigrate(&models.Review{}); err != nil {
		t.Fatalf("migrate Review: %v", err)
	}
	cfg := fixtureConfig()

	notJoon := seedUser(t, db, "notJoon")        // onbloc
	r3v4s := seedUser(t, db, "r3v4s")            // onbloc
	zxxma := seedUser(t, db, "zxxma")            // samouraiworld
	n0izn0iz := seedUser(t, db, "n0izn0iz")      // samouraiworld
	outsider := seedUser(t, db, "outsider")      // no team

	mergedAt := time.Now().UTC().Add(-time.Hour)

	// Onbloc author, samouraiworld reviewer (the canonical "collab" cell).
	prA := seedMergedPRReturnID(t, db, "gnolang/gno", notJoon, mergedAt)
	seedReview(t, db, prA, zxxma, "gnolang/gno", mergedAt)
	seedReview(t, db, prA, n0izn0iz, "gnolang/gno", mergedAt)

	// Onbloc author, onbloc reviewer (same-team cell).
	prB := seedMergedPRReturnID(t, db, "onbloc/gnoscan", notJoon, mergedAt)
	seedReview(t, db, prB, r3v4s, "onbloc/gnoscan", mergedAt)

	// Outsider author with onbloc reviewer — outsider author bucket.
	prC := seedMergedPRReturnID(t, db, "other/repo", outsider, mergedAt)
	seedReview(t, db, prC, notJoon, "other/repo", mergedAt)

	// Onbloc author, outsider reviewer — outsider reviewer bucket.
	prD := seedMergedPRReturnID(t, db, "gnolang/gno", notJoon, mergedAt)
	seedReview(t, db, prD, outsider, "gnolang/gno", mergedAt)

	resp, err := computeTeamCollab(db, cfg, "")
	if err != nil {
		t.Fatalf("computeTeamCollab: %v", err)
	}
	if resp.SchemaVersion != collabSchemaVer {
		t.Errorf("schemaVersion = %d, want %d", resp.SchemaVersion, collabSchemaVer)
	}
	cellMap := map[string]int{}
	for _, c := range resp.Cells {
		cellMap[c.AuthorTeam+":"+c.ReviewerTeam] = c.Reviews
	}
	if got := cellMap["onbloc:samouraiworld"]; got != 2 {
		t.Errorf("onbloc → samouraiworld = %d, want 2", got)
	}
	if got := cellMap["onbloc:onbloc"]; got != 1 {
		t.Errorf("onbloc → onbloc = %d, want 1 (intra-team r3v4s review of notJoon)", got)
	}
	if got := resp.OutsiderReviewsByReviewerTeam["onbloc"]; got != 1 {
		t.Errorf("outsider→onbloc bucket = %d, want 1", got)
	}
	if got := resp.OutsiderReviewsByAuthorTeam["onbloc"]; got != 1 {
		t.Errorf("onbloc→outsider bucket = %d, want 1", got)
	}
}

func TestComputeTeamCollab_ExcludesDependabotAndSelfReviews(t *testing.T) {
	db := newTestDB(t)
	if err := db.AutoMigrate(&models.Review{}); err != nil {
		t.Fatalf("migrate Review: %v", err)
	}
	cfg := fixtureConfig()

	notJoon := seedUser(t, db, "notJoon")
	dependabot := seedUser(t, db, "dependabot")
	mergedAt := time.Now().UTC().Add(-time.Hour)

	// Self-review: notJoon reviews their own PR. Must be filtered out.
	prSelf := seedMergedPRReturnID(t, db, "gnolang/gno", notJoon, mergedAt)
	seedReview(t, db, prSelf, notJoon, "gnolang/gno", mergedAt)

	// Dependabot as author — bot row should be ignored entirely.
	prBot := seedMergedPRReturnID(t, db, "gnolang/gno", dependabot, mergedAt)
	seedReview(t, db, prBot, notJoon, "gnolang/gno", mergedAt)

	// Dependabot as reviewer — also ignored.
	prRev := seedMergedPRReturnID(t, db, "gnolang/gno", notJoon, mergedAt)
	seedReview(t, db, prRev, dependabot, "gnolang/gno", mergedAt)

	resp, err := computeTeamCollab(db, cfg, "")
	if err != nil {
		t.Fatalf("computeTeamCollab: %v", err)
	}
	if len(resp.Cells) != 0 {
		t.Errorf("cells = %+v, want empty (everything filtered)", resp.Cells)
	}
	if len(resp.OutsiderReviewsByAuthorTeam) != 0 {
		t.Errorf("outsider author bucket = %+v, want empty", resp.OutsiderReviewsByAuthorTeam)
	}
	if len(resp.OutsiderReviewsByReviewerTeam) != 0 {
		t.Errorf("outsider reviewer bucket = %+v, want empty", resp.OutsiderReviewsByReviewerTeam)
	}
}

func TestHandleGetTeamCollab_CachesResponse(t *testing.T) {
	db := newTestDB(t)
	if err := db.AutoMigrate(&models.Review{}); err != nil {
		t.Fatalf("migrate Review: %v", err)
	}
	cfg := fixtureConfig()
	cache, _ := ristretto.NewCache(&ristretto.Config{NumCounters: 1000, MaxCost: 1 << 20, BufferItems: 64})

	notJoon := seedUser(t, db, "notJoon")
	zxxma := seedUser(t, db, "zxxma")
	mergedAt := time.Now().UTC().Add(-time.Hour)

	pr := seedMergedPRReturnID(t, db, "gnolang/gno", notJoon, mergedAt)
	seedReview(t, db, pr, zxxma, "gnolang/gno", mergedAt)

	h := HandleGetTeamCollab(db, cfg, cache)

	rec1 := httptest.NewRecorder()
	h.ServeHTTP(rec1, httptest.NewRequest(http.MethodGet, "/team-collab", nil))
	if rec1.Code != http.StatusOK {
		t.Fatalf("first call status = %d", rec1.Code)
	}
	cache.Wait()

	// Mutate underlying data: if the second call hits cache, the response stays identical.
	pr2 := seedMergedPRReturnID(t, db, "gnolang/gno", notJoon, mergedAt)
	seedReview(t, db, pr2, zxxma, "gnolang/gno", mergedAt)

	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, httptest.NewRequest(http.MethodGet, "/team-collab", nil))
	if rec1.Body.String() != rec2.Body.String() {
		t.Errorf("cache miss between calls\n1: %s\n2: %s", rec1.Body, rec2.Body)
	}

	// Different period key must NOT hit the prior cache entry.
	rec3 := httptest.NewRecorder()
	h.ServeHTTP(rec3, httptest.NewRequest(http.MethodGet, "/team-collab?time=monthly", nil))
	var bodyMonthly collabResponse
	if err := json.Unmarshal(rec3.Body.Bytes(), &bodyMonthly); err != nil {
		t.Fatalf("unmarshal monthly: %v", err)
	}
	if bodyMonthly.Period != "monthly" {
		t.Errorf("period = %q, want monthly", bodyMonthly.Period)
	}
}
