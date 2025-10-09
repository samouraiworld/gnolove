package ai

import (
	"encoding/json"
	"net/http"
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

func unmarshalReportData(report models.Report) (map[string]interface{}, error) {
	var dataObj map[string]interface{}

	if err := json.Unmarshal([]byte(report.Data), &dataObj); err != nil {
		return nil, err
	}

	return dataObj, nil
}
