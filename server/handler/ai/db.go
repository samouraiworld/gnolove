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

// Daily cooldown — prevent excessive LLM calls (max 1 attempt per 24h).
var (
	lastAttemptMu   sync.Mutex
	lastAttemptTime time.Time
)

const reportCooldown = 24 * time.Hour

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

// GenerateReport creates a new report based on the latest 7 days PRs and issues data and saves it in the database.
// It is idempotent: if a report already exists for the current week (Monday-Sunday), it returns it instead of creating a duplicate.
func GenerateReport(db *gorm.DB) (models.Report, error) {
	// Compute current week boundaries (Monday 00:00 to Sunday 23:59:59)
	now := time.Now().UTC()
	weekday := now.Weekday()
	if weekday == time.Sunday {
		weekday = 7
	}
	weekStart := time.Date(now.Year(), now.Month(), now.Day()-int(weekday)+1, 0, 0, 0, 0, time.UTC)
	weekEnd := weekStart.AddDate(0, 0, 7).Add(-time.Second)

	// Check if a report already exists for this week
	var existing models.Report
	err := db.Where("created_at >= ? AND created_at <= ?", weekStart, weekEnd).First(&existing).Error
	if err == nil {
		return existing, nil
	}

	// Daily cooldown — avoid hammering LLM APIs on repeated calls/retries
	lastAttemptMu.Lock()
	if time.Since(lastAttemptTime) < reportCooldown {
		lastAttemptMu.Unlock()
		return models.Report{}, fmt.Errorf("report generation on cooldown (last attempt: %s, retry after %s)",
			lastAttemptTime.Format(time.RFC3339),
			lastAttemptTime.Add(reportCooldown).Format(time.RFC3339))
	}
	lastAttemptTime = now
	lastAttemptMu.Unlock()

	endTime := now
	startTime := endTime.AddDate(0, 0, -7)

	// Fetch merged pull requests
	var pullRequests []models.PullRequest
	if err := db.Where("state = ? AND merged_at BETWEEN ? AND ?", "MERGED", startTime, endTime).
		Preload("Author").Find(&pullRequests).Error; err != nil {
		return models.Report{}, err
	}

	// Extract required fields from pull requests
	var formattedPullRequests []map[string]interface{}
	for _, pr := range pullRequests {
		var authorData map[string]interface{}
		if pr.Author != nil {
			authorData = map[string]interface{}{
				"login": pr.Author.Login,
				"name":  pr.Author.Name,
				"bio":   pr.Author.Bio,
			}
		}
		formattedPullRequests = append(formattedPullRequests, map[string]interface{}{
			"updatedAt":    pr.UpdatedAt,
			"repositoryID": pr.RepositoryID,
			"title":        pr.Title,
			"author":       authorData,
		})
	}

	// Fetch open issues
	var issues []models.Issue
	if err := db.Where("state = ? AND created_at BETWEEN ? AND ?", "OPEN", startTime, endTime).
		Preload("Author").Find(&issues).Error; err != nil {
		return models.Report{}, err
	}

	// Extract required fields from issues
	var formattedIssues []map[string]interface{}
	for _, issue := range issues {
		var authorData map[string]interface{}
		if issue.Author != nil {
			authorData = map[string]interface{}{
				"login": issue.Author.Login,
				"name":  issue.Author.Name,
				"bio":   issue.Author.Bio,
			}
		}
		formattedIssues = append(formattedIssues, map[string]interface{}{
			"updatedAt":    issue.UpdatedAt,
			"repositoryID": issue.RepositoryID,
			"title":        issue.Title,
			"author":       authorData,
		})
	}

	// Prepare ai input data
	inputData := map[string]interface{}{
		"pullRequests": formattedPullRequests,
		"issues":       formattedIssues,
	}

	inputDataJSON, err := json.Marshal(inputData)
	if err != nil {
		return models.Report{}, err
	}

	userPrompt := string(inputDataJSON)

	// Generate report using LLM (OpenRouter free tier preferred, Mistral fallback)
	assistantResponse, err := providers.AskLLM(reportSystemPrompt, userPrompt, reportOutputFormatSchema)
	if err != nil {
		return models.Report{}, err
	}

	// Parse assistantResponse into a valid JSON format
	var parsedData map[string]interface{}
	if err := json.Unmarshal([]byte(assistantResponse), &parsedData); err != nil {
		return models.Report{}, fmt.Errorf("invalid JSON format in assistant response: %w", err)
	}

	// Convert parsedData back to a JSON string
	formattedData, err := json.Marshal(parsedData)
	if err != nil {
		return models.Report{}, fmt.Errorf("failed to format assistant response as JSON: %w", err)
	}

	// Create a new report instance
	report := models.Report{
		ID:         uuid.New().String(),
		CreatedAt:  time.Now(),
		Data:       string(formattedData),
		UserPrompt: userPrompt,
	}

	// Save the report to the database
	if err := db.Create(&report).Error; err != nil {
		return models.Report{}, err
	}

	return report, nil
}
