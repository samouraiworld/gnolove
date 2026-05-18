package ai

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func HandleGetLastReport(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		lastReport, err := GetLastReport(db)
		if err != nil {
			if err.Error() == "no reports found" {
				http.Error(w, err.Error(), http.StatusNotFound)
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		dataObj, err := unmarshalReportData(*lastReport)
		if err != nil {
			http.Error(w, "Failed to decode report data or user prompt", http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"id":        lastReport.ID,
			"createdAt": lastReport.CreatedAt,
			"data":      dataObj,
		}

		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

func HandleGetReportByWeek(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		startStr := r.URL.Query().Get("start")
		endStr := r.URL.Query().Get("end")
		if startStr == "" || endStr == "" {
			http.Error(w, "start and end parameters are required", http.StatusBadRequest)
			return
		}

		startDate, err := time.Parse(time.RFC3339, startStr)
		if err != nil {
			http.Error(w, "invalid start date format (expected RFC3339)", http.StatusBadRequest)
			return
		}
		endDate, err := time.Parse(time.RFC3339, endStr)
		if err != nil {
			http.Error(w, "invalid end date format (expected RFC3339)", http.StatusBadRequest)
			return
		}

		report, err := GetReportByWeek(db, startDate, endDate)
		if err != nil {
			if err.Error() == "no report found for the specified week" {
				http.Error(w, err.Error(), http.StatusNotFound)
				return
			}
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		dataObj, err := unmarshalReportData(*report)
		if err != nil {
			http.Error(w, "Failed to decode report data or user prompt", http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"id":        report.ID,
			"createdAt": report.CreatedAt,
			"data":      dataObj,
		}

		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

func HandleGetAllReports(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		reports, err := GetAllReports(db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var formattedReports []map[string]interface{}
		for _, report := range reports {
			dataObj, err := unmarshalReportData(report)
			if err != nil {
				http.Error(w, "Failed to decode report data or user prompt", http.StatusInternalServerError)
				return
			}

			formattedReports = append(formattedReports, map[string]interface{}{
				"id":        report.ID,
				"createdAt": report.CreatedAt,
				"data":      dataObj,
			})
		}

		if formattedReports == nil {
			formattedReports = []map[string]interface{}{}
		}
		if err := json.NewEncoder(w).Encode(formattedReports); err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	}
}

// HandleGenerateReport handles POST /ai/report/generate
// Triggers manual report generation. Idempotent — returns existing report if one exists for the current week.
func HandleGenerateReport(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")

		report, err := GenerateReport(db)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		dataObj, err := unmarshalReportData(report)
		if err != nil {
			http.Error(w, "Report generated but failed to parse data", http.StatusInternalServerError)
			return
		}

		response := map[string]interface{}{
			"id":            report.ID,
			"createdAt":     report.CreatedAt,
			"promptVersion": report.PromptVersion,
			"data":          dataObj,
		}

		json.NewEncoder(w).Encode(response)
	}
}

// HandleRegenerateReport handles POST /ai/report/regenerate.
// Overwrites the report for the cycle containing ?cycleStart=RFC3339
// (defaults to this week's Monday) using ?promptVersion=N (defaults to 2).
// Bypasses the daily cooldown — this is the operator-triggered fallback for
// when the Sunday cron misses a cycle.
func HandleRegenerateReport(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")

		cycleStart := time.Now().UTC()
		if cs := r.URL.Query().Get("cycleStart"); cs != "" {
			t, err := time.Parse(time.RFC3339, cs)
			if err != nil {
				http.Error(w, "invalid cycleStart (expected RFC3339)", http.StatusBadRequest)
				return
			}
			cycleStart = t
		}
		promptVersion := PromptVersion2
		if v := r.URL.Query().Get("promptVersion"); v != "" {
			parsed, err := strconv.Atoi(v)
			if err != nil || (parsed != 1 && parsed != PromptVersion2) {
				http.Error(w, "promptVersion must be 1 or 2", http.StatusBadRequest)
				return
			}
			promptVersion = parsed
		}

		report, err := RegenerateReport(db, nil, cycleStart, promptVersion)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		dataObj, err := unmarshalReportData(report)
		if err != nil {
			http.Error(w, "regenerated but failed to parse data", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"id":            report.ID,
			"createdAt":     report.CreatedAt,
			"promptVersion": report.PromptVersion,
			"data":          dataObj,
		})
	}
}

func unmarshalReportData(report models.Report) (map[string]interface{}, error) {
	var dataObj map[string]interface{}

	if err := json.Unmarshal([]byte(report.Data), &dataObj); err != nil {
		return nil, err
	}

	return dataObj, nil
}
