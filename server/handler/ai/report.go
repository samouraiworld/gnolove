package ai

import (
	"encoding/json"
	"net/http"
	"time"

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
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		var obj GnoReport
		if err := json.Unmarshal([]byte(lastReport.Data), &obj); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to decode report data"})
			return
		}
		if err := json.NewEncoder(w).Encode(obj); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode report"})
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
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		var obj GnoReport
		if err := json.Unmarshal([]byte(report.Data), &obj); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to decode report data"})
			return
		}
		if err := json.NewEncoder(w).Encode(obj); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode report"})
			return
		}
	}
}
