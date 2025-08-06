package report

import (
	"encoding/json"
	"net/http"

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

		if err := json.NewEncoder(w).Encode(lastReport); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to encode report"})
			return
		}
	}
}
