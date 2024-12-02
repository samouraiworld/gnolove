package handler

import (
	"encoding/json"
	"net/http"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func GetMilestone(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		milestoneNumber := r.PathValue("number")

		var milestone models.Milestone

		err := db.Model(&models.Milestone{}).
			Preload("Author").Preload("Issues").Preload("Issues.Author").Preload("Issues.Assignees.User").Preload("Issues.Labels").
			Where("number = ?", milestoneNumber).First(&milestone).Error
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))

			return
		}

		json.NewEncoder(w).Encode(milestone)
	}
}
