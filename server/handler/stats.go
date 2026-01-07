package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/dgraph-io/ristretto"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func getUserStats(db *gorm.DB, startTime time.Time, exclude, repositories []string) ([]UserWithStats, *time.Time, error) {
	// Get last sync time
	var syncStatus models.SyncStatus
	var returnedTime *time.Time
	db.First(&syncStatus, 1)
	if !syncStatus.LastSyncedAt.IsZero() {
		time := syncStatus.LastSyncedAt.UTC()
		returnedTime = &time
	}

	users := make([]models.User, 0)
	query := db.Model(&models.User{})

	if len(exclude) > 0 {
		for i, login := range exclude {
			exclude[i] = strings.ToLower(login)
		}

		query = query.Where("LOWER(login) NOT IN ?", exclude)
	}

	err := query.
		Preload("Commits", func(db *gorm.DB) *gorm.DB {
			return db.Where("created_at > ? AND repository_id IN (?)", startTime, repositories).
				Order("created_at DESC")
		}).
		Preload("PullRequests", func(db *gorm.DB) *gorm.DB {
			return db.Where("created_at > ? AND repository_id IN (?)", startTime, repositories).
				Order("created_at DESC")
		}).
		Preload("Reviews", func(db *gorm.DB) *gorm.DB {
			return db.Where("created_at > ? AND repository_id IN (?)", startTime, repositories).
				Order("created_at DESC")
		}).
		Preload("Issues", func(db *gorm.DB) *gorm.DB {
			return db.Where("created_at > ? AND repository_id IN (?)", startTime, repositories).
				Order("created_at DESC")
		}).
		Preload("Reviews.PullRequest").
		Find(&users).Error
	if err != nil {
		return nil, returnedTime, err
	}
	res := make([]UserWithStats, 0, len(users))

	for _, user := range users {
		user.Reviews = slices.DeleteFunc(user.Reviews, func(review models.Review) bool {
			return review.PullRequest.State != "MERGED" || review.PullRequest.AuthorID == review.AuthorID
		})
		if getLastContribution(user) == nil {
			continue
		}

		user.PullRequests = getPrByState(user.PullRequests, "MERGED")

		score := CalculateScore(int64(len(user.Commits)), int64(len(user.Issues)), int64(len(user.PullRequests)), int64(len(user.Reviews)))
		res = append(res, UserWithStats{
			User: models.User{
				Login:     user.Login,
				ID:        user.ID,
				AvatarUrl: user.AvatarUrl,
				URL:       user.URL,
				Name:      user.Name,
			},
			TotalCommits:              len(user.Commits),
			TotalPrs:                  len(user.PullRequests),
			TotalIssues:               len(user.Issues),
			TotalReviewedPullRequests: len(user.Reviews),
			LastContribution:          getLastContribution(user),
			Score:                     score,
		})
	}

	slices.SortFunc(res, func(a, b UserWithStats) int {
		return (b.TotalCommits + b.TotalPrs + b.TotalIssues + b.TotalReviewedPullRequests) -
			(a.TotalCommits + a.TotalPrs + a.TotalIssues + a.TotalReviewedPullRequests)
	})

	return res, returnedTime, nil
}

func getPrByState(prs []models.PullRequest, state string) []models.PullRequest {
	prs = slices.DeleteFunc(prs, func(pr models.PullRequest) bool {
		return pr.State != state
	})
	return prs
}

type UserWithStats struct {
	models.User
	TotalCommits              int
	TotalPrs                  int
	TotalIssues               int
	TotalReviewedPullRequests int
	LastContribution          interface{}
	Score                     float64 `json:"score"`
}

type UserStatsResponse struct {
	LastSyncedAt *time.Time      `json:"lastSyncedAt"`
	Users        []UserWithStats `json:"users"`
}

func HandleGetUserStats(db *gorm.DB, cache *ristretto.Cache) func(w http.ResponseWriter, r *http.Request) {
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

		exclude := r.URL.Query()["exclude"]
		repositories := getRepositoriesWithRequest(r)

		cacheKey := fmt.Sprintf("stats:%s:%s:%s", strings.Join(repositories, ","), strings.Join(exclude, ","), r.URL.Query().Get("time"))
		data, ok := cache.Get(cacheKey)
		if ok {
			json.NewEncoder(w).Encode(data.(UserStatsResponse))
		} else {
			stats, lastSyncedAt, err := getUserStats(db, startTime, exclude, repositories)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(err.Error()))

				return
			}

			resp := UserStatsResponse{
				LastSyncedAt: lastSyncedAt,
				Users:        stats,
			}
			cache.SetWithTTL(cacheKey, resp, 0, time.Minute*5)
			json.NewEncoder(w).Encode(resp)
		}

	}
}

func HandleGetLastPrs(db *gorm.DB, cache *ristretto.Cache) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		repositories := getRepositoriesWithRequest(r)

		cacheKey := fmt.Sprintf("lastprs:%s:%s", strings.Join(repositories, ","), r.URL.Query().Get("time"))
		data, ok := cache.Get(cacheKey)
		if ok {
			json.NewEncoder(w).Encode(data.([]*models.PullRequest))
		} else {
			lastPRs, err := getLastPrs(db, repositories)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(err.Error()))

				return
			}

			cache.SetWithTTL(cacheKey, lastPRs, 0, time.Minute*5)
			json.NewEncoder(w).Encode(lastPRs)
		}

	}
}

func HandleGetNewestContributors(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		number := r.URL.Query().Get("number")
		if number == "" {
			number = "5"
		}
		_, err := strconv.Atoi(number)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		repositories := getRepositoriesWithRequest(r)
		placeholders := make([]string, len(repositories))
		args := make([]interface{}, len(repositories))

		for i, repository := range repositories {
			placeholders[i] = fmt.Sprintf("$%d", i+1)
			args[i] = repository
		}
		query := fmt.Sprintf(`
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
				where (pr.created_at is not null OR i.created_at is not null) 
				AND i.repository_id in (%s) AND pr.repository_id in (%s)
				group by u.id
				order by oldest_contribution desc
				limit %s
		)
		select * from users u
		inner join users_with_oldest_contribution uc on uc.id =u.id
		order by uc.oldest_contribution desc
		`, strings.Join(placeholders, ","), strings.Join(placeholders, ","), number)
		var users []models.User

		err = db.Model(&models.User{}).Raw(query, args...).
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

func getRepositoriesWithRequest(r *http.Request) []string {
	if r.URL.Query().Get("repositories") == "" {
		return []string{"gnolang/gno"}
	} else {
		return strings.Split(r.URL.Query().Get("repositories"), ",")
	}
}
