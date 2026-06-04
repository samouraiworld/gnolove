package handler

import (
	"encoding/json"
	"net/http"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

// HandleGetNotablePRs serves the mirrored gnolang "Notable PRs" board (#66),
// most-recently-updated first. Returns [] when the board is empty or the
// project sync has not run / lacks the read:project token scope.
func HandleGetNotablePRs(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		items := []models.NotablePR{}
		if err := db.Order("updated_at desc").Find(&items).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		json.NewEncoder(w).Encode(items)
	}
}
