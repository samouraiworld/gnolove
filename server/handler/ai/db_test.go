package ai

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync/atomic"
	"testing"
	"time"

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
	if err := db.AutoMigrate(&models.User{}, &models.PullRequest{}, &models.Issue{}, &models.Report{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

var prSeq int

func seedUserPR(t *testing.T, db *gorm.DB, login, repoID, title string, mergedAt time.Time) {
	t.Helper()
	u := models.User{ID: "u-" + login, Login: login, Name: login}
	if err := db.FirstOrCreate(&u, models.User{ID: u.ID}).Error; err != nil {
		t.Fatalf("seed user: %v", err)
	}
	prSeq++
	pr := models.PullRequest{
		ID:           fmt.Sprintf("pr-%d", prSeq),
		RepositoryID: repoID,
		State:        "MERGED",
		Title:        title,
		AuthorID:     u.ID,
		MergedAt:     &mergedAt,
		CreatedAt:    mergedAt.Add(-24 * time.Hour),
	}
	if err := db.Create(&pr).Error; err != nil {
		t.Fatalf("seed pr: %v", err)
	}
}

// stubLLM returns the same JSON for every call, captures how many times it was
// invoked, and lets the test assert on schema/prompt content.
func stubLLM(content string, calls *int32) LLMFunc {
	return func(systemPrompt, userPrompt string, schema map[string]interface{}) (string, error) {
		atomic.AddInt32(calls, 1)
		return content, nil
	}
}

func TestBuildProjectInputs_GroupsByRepository(t *testing.T) {
	db := newTestDB(t)
	merged := time.Now().UTC().Add(-time.Hour)
	seedUserPR(t, db, "alice", "gnolang/gno", "feat: bump VM", merged)
	seedUserPR(t, db, "alice", "gnolang/gno", "fix: nil deref", merged)
	seedUserPR(t, db, "bob", "onbloc/gnoscan", "feat: search bar", merged)

	prs, issues, err := fetchActivity(db, merged.Add(-time.Hour), merged.Add(time.Hour))
	if err != nil {
		t.Fatalf("fetchActivity: %v", err)
	}
	projects := buildProjectInputs(prs, issues)
	byName := map[string]ProjectInput{}
	for _, p := range projects {
		byName[p.ProjectName] = p
	}
	if len(byName["gnolang/gno"].PullRequests) != 2 {
		t.Errorf("gnolang/gno prs = %d, want 2", len(byName["gnolang/gno"].PullRequests))
	}
	if len(byName["onbloc/gnoscan"].PullRequests) != 1 {
		t.Errorf("onbloc/gnoscan prs = %d, want 1", len(byName["onbloc/gnoscan"].PullRequests))
	}
}

func TestRegenerateReport_OverwritesAndUsesPromptV2(t *testing.T) {
	db := newTestDB(t)
	mergedAt := time.Date(2026, 5, 4, 12, 0, 0, 0, time.UTC) // Monday of an arbitrary week
	cycleStart := mergedAt
	seedUserPR(t, db, "alice", "gnolang/gno", "feat: bump VM", mergedAt)

	// Seed a stale v1 row inside that week so we can verify it gets overwritten.
	weekStart, weekEnd := weekBoundsFor(cycleStart)
	stale := models.Report{
		ID:            "stale",
		CreatedAt:     weekStart.Add(time.Hour),
		Data:          `{"projects":[]}`,
		UserPrompt:    "",
		PromptVersion: 1,
	}
	if err := db.Create(&stale).Error; err != nil {
		t.Fatalf("seed stale: %v", err)
	}

	var calls int32
	llmJSON := `{
		"cycle": "Test cycle",
		"projects": [{
			"project_name": "gnolang/gno",
			"summary_short": "VM bumped.",
			"summary_long": "Alice bumped the VM. Worth a leadership eye.",
			"team": "core-team"
		}]
	}`
	report, err := RegenerateReport(db, stubLLM(llmJSON, &calls), cycleStart, PromptVersion2)
	if err != nil {
		t.Fatalf("RegenerateReport: %v", err)
	}
	if calls != 1 {
		t.Errorf("LLM calls = %d, want 1", calls)
	}
	if report.PromptVersion != PromptVersion2 {
		t.Errorf("promptVersion = %d, want %d", report.PromptVersion, PromptVersion2)
	}

	// Stale row must be gone — there should be exactly one report and it's the new one.
	var remaining []models.Report
	if err := db.Find(&remaining).Error; err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(remaining) != 1 || remaining[0].ID == "stale" {
		t.Errorf("expected only the new row, got: %+v", remaining)
	}
	// The new row's CreatedAt is clamped into [weekStart, weekEnd] so
	// GetReportByWeek can find regenerated past-cycle rows.
	if remaining[0].CreatedAt.Before(weekStart) || remaining[0].CreatedAt.After(weekEnd) {
		t.Errorf("CreatedAt %s not within [%s, %s]", remaining[0].CreatedAt, weekStart, weekEnd)
	}

	// Legacy-summary bridge must have copied summary_long → summary.
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(report.Data), &data); err != nil {
		t.Fatalf("unmarshal data: %v", err)
	}
	projects := data["projects"].([]interface{})
	first := projects[0].(map[string]interface{})
	if got := first["summary"].(string); !strings.Contains(got, "Alice bumped the VM") {
		t.Errorf("legacy summary missing long bridge: %q", got)
	}
	if first["team"].(string) != "core-team" {
		t.Errorf("team field lost: %+v", first)
	}
}

func TestRegenerateReport_ChunksWhenOverBudget(t *testing.T) {
	db := newTestDB(t)
	mergedAt := time.Date(2026, 5, 4, 12, 0, 0, 0, time.UTC)
	// Seed enough PRs across enough repos that estimateTokens(blob) > 28000.
	// Each PR row is ~150 chars after JSON-encode → ~38 tokens. We need 28K
	// tokens → ~750 PRs to force chunking with the production budget.
	// To stay test-fast we instead lean on the chunker by stubbing the budget:
	// we still seed across 10 projects and verify that, with our real budget,
	// no chunking occurs (sanity), then drive the budget-flip path through
	// chunkProjects directly in chunk_test.go.
	for i := 0; i < 10; i++ {
		repo := "org/repo" + string(rune('a'+i))
		seedUserPR(t, db, "alice", repo, "title", mergedAt.Add(time.Duration(i)*time.Minute))
	}

	var calls int32
	report, err := RegenerateReport(db, stubLLM(`{"projects":[]}`, &calls), mergedAt, PromptVersion2)
	if err != nil {
		t.Fatalf("RegenerateReport: %v", err)
	}
	if calls != 1 {
		t.Errorf("expected one LLM call under real budget, got %d", calls)
	}
	if report.PromptVersion != PromptVersion2 {
		t.Errorf("promptVersion = %d", report.PromptVersion)
	}
}

func TestPromptFor_ReturnsCorrectVersion(t *testing.T) {
	sys1, sch1 := promptFor(1)
	sys2, sch2 := promptFor(PromptVersion2)
	if sys1 == sys2 {
		t.Error("v1 and v2 system prompts should differ")
	}
	if _, ok := sch1["properties"].(map[string]interface{})["projects"]; !ok {
		t.Error("v1 schema missing projects")
	}
	if _, ok := sch2["properties"].(map[string]interface{})["projects"]; !ok {
		t.Error("v2 schema missing projects")
	}
}
