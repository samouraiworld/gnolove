package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func getUserStats(db *gorm.DB, startTime time.Time) ([]UserWithStats, error) {
	users := make([]models.User, 0)
	err := db.Model(&models.User{}).
		Preload("Commits", "created_at > ? order by created_at desc", startTime).
		Preload("PullRequests", "created_at > ? order by created_at desc", startTime).
		Preload("Reviews", "created_at > ? ", startTime).
		Preload("Reviews.PullRequest").
		Preload("Issues", "created_at > ? order by created_at desc", startTime).
		Preload("Issues.Assignees.User").
		Preload("Issues.Labels").
		Find(&users).Error
	if err != nil {
		return nil, err
	}
	res := make([]UserWithStats, len(users))

	for index, user := range users {
		user.Reviews = slices.DeleteFunc(user.Reviews, func(review models.Review) bool {
			return review.PullRequest.State != "MERGED"
		})

		res[index] = UserWithStats{
			User:                      user,
			TotalCommits:              len(user.Commits),
			TotalPrs:                  len(user.PullRequests),
			TotalIssues:               len(user.Issues),
			TotalReviewedPullRequests: len(user.Reviews),
			LastContribution:          getLastContribution(user),
		}
	}
	return res, nil
}

type UserWithStats struct {
	models.User
	TotalCommits              int
	TotalPrs                  int
	TotalIssues               int
	TotalReviewedPullRequests int
	LastContribution          interface{}
}

func HandleGetUserStats(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var startTime time.Time
		switch r.URL.Query().Get("time") {
		case "daily":
			startTime = time.Now().AddDate(0, 0, -1)
		case "weekly":
			startTime = time.Now().AddDate(0, 0, -7)
		case "monthly":
			startTime = time.Now().AddDate(0, -1, 0)
		case "yearly":
			startTime = time.Now().AddDate(-1, 0, 0)
		}
		fmt.Println(startTime)

		stats, err := getUserStats(db, startTime)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))

			return
		}
		json.NewEncoder(w).Encode(stats)
	}
}

func HandleGetNewestContributors(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		number := r.URL.Query().Get("number")

		query := `
		with users_with_oldest_contribution as (
			select 
				min(
					CASE 
						WHEN pr.created_at is null then i.created_at 
						WHEN i.created_at < pr.created_at  THEN i.created_at
						ELSE pr.created_at  
					END 
				) oldest_contribution,u.id 
				from users u
				left join issues i on i.author_id =u.id 
				left join pull_requests pr on pr.author_id =u.id 
				where pr.created_at is not null OR i.created_at is not null
				group by u.id
				order by oldest_contribution desc
				limit $1
		)
		select * from users u 
		inner join users_with_oldest_contribution uc on uc.id =u.id 
		order by uc.oldest_contribution desc
		`
		var users []models.User

		err := db.Model(&models.User{}).Raw(query, number).
			Find(&users).Error
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))

			return
		}

		json.NewEncoder(w).Encode(users)
	}
}

func getLastContribution(user models.User) interface{} {
	var newest interface{}
	var lastTime time.Time
	if len(user.Commits) > 0 {
		newest = user.Commits[0]
		lastTime = user.Commits[0].CreatedAt
	}

	if len(user.Issues) > 0 && user.Issues[0].CreatedAt.After(lastTime) {
		newest = user.Issues[0]
		lastTime = user.Issues[0].CreatedAt
	}

	if len(user.PullRequests) > 0 && user.PullRequests[0].CreatedAt.After(lastTime) {
		newest = user.PullRequests[0]
	}

	return newest
}
