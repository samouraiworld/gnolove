package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func GetIssues(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		label := r.URL.Query().Get("label")
		var issues []models.Issue
		fmt.Println(label)

		query := db.Model(&models.Issue{}).Order("created_at desc")
		if label != "" {
			query = query.Where("labels like ?", "%"+label+"%")
		}

		err := query.Find(&issues).Error
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))

			return
		}
		json.NewEncoder(w).Encode(issues)
	}
}
