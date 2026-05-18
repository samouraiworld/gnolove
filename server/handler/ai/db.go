package ai

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/providers"
	"gorm.io/gorm"
)

// Daily cooldown — prevent excessive LLM calls (max 1 attempt per 24h)
// on the cron-driven path. RegenerateReport bypasses this (operator-triggered).
var (
	lastAttemptMu   sync.Mutex
	lastAttemptTime time.Time
)

const reportCooldown = 24 * time.Hour

// LLMFunc is the seam between the report generator and the actual provider.
// Tests inject a stub; production passes providers.AskLLM.
type LLMFunc func(systemPrompt, userPrompt string, schema map[string]interface{}) (string, error)

// GetLastReport fetches the last generated report from the database.
func GetLastReport(db *gorm.DB) (*models.Report, error) {
	var lastReport models.Report
	if err := db.Order("created_at desc").First(&lastReport).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("no reports found")
		}
		return nil, err
	}
	return &lastReport, nil
}

func GetReportByWeek(db *gorm.DB, weekStart, weekEnd time.Time) (*models.Report, error) {
	var report models.Report
	if err := db.Where("created_at BETWEEN ? AND ?", weekStart, weekEnd).First(&report).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("no report found for the specified week")
		}
		return nil, err
	}
	return &report, nil
}

// GetAllReports fetches all reports from the database, ordered by creation date descending.
func GetAllReports(db *gorm.DB) ([]models.Report, error) {
	var reports []models.Report
	if err := db.Order("created_at desc").Find(&reports).Error; err != nil {
		return nil, err
	}
	return reports, nil
}

// GenerateReport creates a new report for the current week.
// Idempotent: if a report already exists for the current week, returns it.
// Honours the daily cooldown to avoid hammering LLM APIs on retries.
func GenerateReport(db *gorm.DB) (models.Report, error) {
	weekStart, weekEnd := currentWeekBounds(time.Now().UTC())

	var existing models.Report
	if err := db.Where("created_at >= ? AND created_at <= ?", weekStart, weekEnd).First(&existing).Error; err == nil {
		return existing, nil
	}
	lastAttemptMu.Lock()
	if time.Since(lastAttemptTime) < reportCooldown {
		lastAttemptMu.Unlock()
		return models.Report{}, fmt.Errorf("report generation on cooldown (last attempt: %s, retry after %s)",
			lastAttemptTime.Format(time.RFC3339),
			lastAttemptTime.Add(reportCooldown).Format(time.RFC3339))
	}
	lastAttemptTime = time.Now().UTC()
	lastAttemptMu.Unlock()

	return generateOnce(db, providers.AskLLM, weekStart, weekEnd, PromptVersion2)
}

// RegenerateReport overwrites the report for the cycle containing cycleStart.
// Bypasses the cooldown. Operator-triggered fallback for Sunday-cron misses.
// promptVersion = 2 for the new schema; promptVersion = 1 stays on the legacy schema.
func RegenerateReport(db *gorm.DB, llm LLMFunc, cycleStart time.Time, promptVersion int) (models.Report, error) {
	if llm == nil {
		llm = providers.AskLLM
	}
	weekStart, weekEnd := weekBoundsFor(cycleStart.UTC())
	if err := db.Where("created_at BETWEEN ? AND ?", weekStart, weekEnd).Delete(&models.Report{}).Error; err != nil {
		return models.Report{}, fmt.Errorf("delete existing report: %w", err)
	}
	return generateOnce(db, llm, weekStart, weekEnd, promptVersion)
}

// generateOnce is the shared body of GenerateReport and RegenerateReport.
// It runs the LLM (chunking if the per-project input exceeds the budget) and
// persists the merged result with the given promptVersion.
func generateOnce(db *gorm.DB, llm LLMFunc, startTime, endTime time.Time, promptVersion int) (models.Report, error) {
	pullRequests, issues, err := fetchActivity(db, startTime, endTime)
	if err != nil {
		return models.Report{}, err
	}

	systemPrompt, schema := promptFor(promptVersion)
	projects := buildProjectInputs(pullRequests, issues)

	var allProjects []interface{}
	var cycleLabel string
	for _, chunk := range chunkProjects(projects, mistralInputTokenBudget) {
		input := map[string]interface{}{"projects": chunk}
		userPrompt, err := json.Marshal(input)
		if err != nil {
			return models.Report{}, err
		}
		raw, err := llm(systemPrompt, string(userPrompt), schema)
		if err != nil {
			return models.Report{}, err
		}
		var parsed map[string]interface{}
		if err := json.Unmarshal([]byte(raw), &parsed); err != nil {
			return models.Report{}, fmt.Errorf("invalid JSON in LLM response: %w", err)
		}
		if cycleLabel == "" {
			if v, ok := parsed["cycle"].(string); ok {
				cycleLabel = v
			}
		}
		if ps, ok := parsed["projects"].([]interface{}); ok {
			allProjects = append(allProjects, ps...)
		}
	}

	if promptVersion == PromptVersion2 {
		applyLegacySummaryBridge(allProjects)
	}

	if cycleLabel == "" {
		cycleLabel = fmt.Sprintf("Weekly Report — %s", startTime.Format("January 2, 2006"))
	}
	merged := map[string]interface{}{
		"cycle":    cycleLabel,
		"projects": allProjects,
	}
	data, err := json.Marshal(merged)
	if err != nil {
		return models.Report{}, err
	}

	// UserPrompt is the structured input (handy for forensics). Cap it at
	// a single snapshot, not per-chunk, to keep DB rows readable.
	userInput, err := json.Marshal(map[string]interface{}{"projects": projects})
	if err != nil {
		return models.Report{}, err
	}

	// CreatedAt anchors the report inside the cycle it covers so /ai/report/weekly
	// can find regenerated past-cycle rows. For current-cycle runs we keep
	// time.Now() (which is already within bounds); for past-cycle regenerations
	// we clamp forward to endTime so the row sits at the end of its week.
	createdAt := time.Now().UTC()
	if createdAt.After(endTime) {
		createdAt = endTime
	}
	report := models.Report{
		ID:            uuid.New().String(),
		CreatedAt:     createdAt,
		Data:          string(data),
		UserPrompt:    string(userInput),
		PromptVersion: promptVersion,
	}
	if err := db.Create(&report).Error; err != nil {
		return models.Report{}, err
	}
	return report, nil
}

// applyLegacySummaryBridge copies summary_long into summary if summary was
// omitted by the LLM. The plan keeps the legacy field alive for one rollover
// cycle so v1-only readers don't go blank during the transition.
func applyLegacySummaryBridge(projects []interface{}) {
	for _, p := range projects {
		proj, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		long, _ := proj["summary_long"].(string)
		legacy, _ := proj["summary"].(string)
		if legacy == "" && long != "" {
			proj["summary"] = long
		}
	}
}

func promptFor(version int) (systemPrompt string, schema map[string]interface{}) {
	if version == PromptVersion2 {
		return reportSystemPromptV2, reportOutputFormatSchemaV2
	}
	return reportSystemPrompt, reportOutputFormatSchema
}

// fetchActivity pulls merged PRs and freshly opened issues in [startTime, endTime].
func fetchActivity(db *gorm.DB, startTime, endTime time.Time) ([]models.PullRequest, []models.Issue, error) {
	var prs []models.PullRequest
	if err := db.Where("state = ? AND merged_at BETWEEN ? AND ?", "MERGED", startTime, endTime).
		Preload("Author").Find(&prs).Error; err != nil {
		return nil, nil, err
	}
	var issues []models.Issue
	if err := db.Where("state = ? AND created_at BETWEEN ? AND ?", "OPEN", startTime, endTime).
		Preload("Author").Find(&issues).Error; err != nil {
		return nil, nil, err
	}
	return prs, issues, nil
}

// buildProjectInputs groups PRs + issues by repository so the chunker can
// split clean lines along project boundaries when the input gets large.
func buildProjectInputs(prs []models.PullRequest, issues []models.Issue) []ProjectInput {
	bucket := map[string]*ProjectInput{}
	get := func(repoID string) *ProjectInput {
		if p, ok := bucket[repoID]; ok {
			return p
		}
		p := &ProjectInput{ProjectName: repoID}
		bucket[repoID] = p
		return p
	}
	for _, pr := range prs {
		p := get(pr.RepositoryID)
		p.PullRequests = append(p.PullRequests, map[string]interface{}{
			"updatedAt": pr.UpdatedAt,
			"title":     pr.Title,
			"author":    authorMap(pr.Author),
		})
	}
	for _, is := range issues {
		p := get(is.RepositoryID)
		p.Issues = append(p.Issues, map[string]interface{}{
			"updatedAt": is.UpdatedAt,
			"title":     is.Title,
			"author":    authorMap(is.Author),
		})
	}
	out := make([]ProjectInput, 0, len(bucket))
	for _, p := range bucket {
		out = append(out, *p)
	}
	return out
}

func authorMap(u *models.User) map[string]interface{} {
	if u == nil {
		return nil
	}
	return map[string]interface{}{
		"login": u.Login,
		"name":  u.Name,
		"bio":   u.Bio,
	}
}

func currentWeekBounds(now time.Time) (time.Time, time.Time) {
	return weekBoundsFor(now)
}

// weekBoundsFor returns Monday-00:00 to Sunday-23:59:59 (UTC) containing t.
func weekBoundsFor(t time.Time) (time.Time, time.Time) {
	weekday := t.Weekday()
	if weekday == time.Sunday {
		weekday = 7
	}
	start := time.Date(t.Year(), t.Month(), t.Day()-int(weekday)+1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 0, 7).Add(-time.Second)
	return start, end
}
