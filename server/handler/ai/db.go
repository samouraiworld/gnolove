package ai

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/providers"
	"gorm.io/gorm"
)

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

// GenerateReport creates a new report based on the latest 7days PRs and issues data and save it in database.
func GenerateReport(db *gorm.DB) (models.Report, error) {
	endTime := time.Now()
	startTime := endTime.AddDate(0, 0, -7)

	// Fetch merged pull requests
	var pullRequests []models.PullRequest
	if err := db.Where("state = ? AND created_at BETWEEN ? AND ?", "MERGED", startTime, endTime).
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

	// Generate report using AskAssistant
	assistantResponse, err := providers.AskMistral(reportSystemPrompt, string(inputDataJSON), reportOutputFormatSchema)
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
		ID:        uuid.New().String(),
		CreatedAt: time.Now(),
		Data:      string(formattedData),
	}

	// Save the report to the database
	if err := db.Create(&report).Error; err != nil {
		return models.Report{}, err
	}

	return report, nil
}
