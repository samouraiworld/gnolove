package handler

import (
	"encoding/json"
	"net/http"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func HandleGetRepository(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var repositories []models.Repository

		repositories = []models.Repository{}
		if err := db.Where("listed = ? AND status != ?", true, "private").Order("id").Find(&repositories).Error; err != nil {
			http.Error(w, "Repository catalogue unavailable", http.StatusServiceUnavailable)
			return
		}
		json.NewEncoder(w).Encode(repositories)
	}
}
