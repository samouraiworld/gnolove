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

		db.Model(&models.Repository{}).Find(&repositories)
		json.NewEncoder(w).Encode(repositories)
	}
}
