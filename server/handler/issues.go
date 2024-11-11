package handler

import (
	"encoding/json"
	"net/http"
	"slices"
	"strings"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func GetIssues(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		labels := r.URL.Query().Get("labels")
		var issues []models.Issue
		filteredLabels := strings.Split(labels, ",")

		query := db.Model(&models.Issue{}).Preload("Author").Preload("Assignees").Preload("Assignees.User").
			Preload("Labels").Order("created_at desc")

		err := query.Find(&issues).Error
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))

			return
		}

		res := slices.DeleteFunc(issues, func(issue models.Issue) bool {
			for _, label := range issue.Labels {
				if slices.Contains(filteredLabels, label.Name) {
					return false
				}

			}
			return true
		})

		json.NewEncoder(w).Encode(res)
	}
}
