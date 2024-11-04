package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func getUserStats(db *gorm.DB, startTime time.Time) ([]UserWithStats, error) {
	query := `
	with last_issues as (
		select count(*) total_issues,author_id from issues i 
		where date(i.created_at) > $1
		GROUP BY author_id
	),
	last_prs as (
		select * from pull_requests pr
		where date(created_at) > $1
	),
	last_merged as (
		select count(*) total_merged, author_id from last_prs 
		where state = 'MERGED'
		GROUP BY author_id
	),
	distinct_review AS (
		select DISTINCT r.author_id, r.pull_request_id   from reviews r 
		inner join last_prs lp on r.pull_request_id = lp.id
		where lp.state = 'MERGED'
	),
	last_reviews_on_merged_requests as (
		SELECT count (*) total_review,author_id 
		FROM distinct_review 
		GROUP BY author_id
	)
	select u.*,
	COALESCE(li.total_issues,0) total_issues,
	COALESCE(lm.total_merged,0) total_merged,
	COALESCE(lr.total_review,0) total_review
	from users u 
	left JOIN last_issues li ON li.author_id = u.id
	left JOIN last_merged lm ON lm.author_id = li.author_id 
	left JOIN last_reviews_on_merged_requests lr ON lr.author_id = li.author_id 
	`
	database, err := db.DB()
	if err != nil {
		return nil, err
	}
	rows, err := database.Query(query, startTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	res := make([]UserWithStats, 0)

	for rows.Next() {
		var userWithStats UserWithStats
		err = rows.Scan(
			&userWithStats.Login,
			&userWithStats.ID,
			&userWithStats.AvatarUrl,
			&userWithStats.URL,
			&userWithStats.Name,
			&userWithStats.TotalIssues,
			&userWithStats.TotalMerged,
			&userWithStats.TotalReviewed,
		)
		if err != nil {
			return nil, err
		}
		res = append(res, userWithStats)
	}
	return res, nil
}

type UserWithStats struct {
	models.User
	TotalIssues   int
	TotalMerged   int
	TotalReviewed int
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
