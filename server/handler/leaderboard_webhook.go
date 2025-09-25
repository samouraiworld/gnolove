package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"

	"github.com/go-chi/chi/v5"
)

func calculateNextRunAt(webhook *models.LeaderboardWebhook) time.Time {
	now := time.Now()
	loc, err := time.LoadLocation(webhook.Timezone)
	if err != nil {
		loc = time.Local
	}
	nowInLoc := now.In(loc)

	switch webhook.Frequency {
	case "daily":
		candidate := time.Date(nowInLoc.Year(), nowInLoc.Month(), nowInLoc.Day(), webhook.Hour, webhook.Minute, 0, 0, loc)
		if candidate.Before(nowInLoc) {
			candidate = candidate.AddDate(0, 0, 1)
		}
		return candidate
	default:
		// Default is weekly
		// Get last sunday and then add up the day and hour/minute based on the one specified by the user
		lastSunday := time.Now().In(loc).AddDate(0, 0, -int(nowInLoc.Weekday())).Truncate(24 * time.Hour)
		candidate := lastSunday.Add(time.Duration(webhook.Hour)*time.Hour+time.Duration(webhook.Minute)*time.Minute).AddDate(0, 0, webhook.Day)
		if candidate.Before(nowInLoc) {
			candidate = candidate.AddDate(0, 0, 7)
		}
		return candidate
	}
}

func checkWebhookInput(webhook *models.LeaderboardWebhook) error {
	if webhook.Type != "discord" && webhook.Type != "slack" {
		return fmt.Errorf("invalid type")
	}
	if strings.TrimSpace(webhook.Url) == "" {
		return fmt.Errorf("url is required")
	}
	if _, err := url.ParseRequestURI(webhook.Url); err != nil {
		return fmt.Errorf("invalid url")
	}
	if webhook.Frequency != "daily" && webhook.Frequency != "weekly" {
		return fmt.Errorf("invalid frequency")
	}
	if webhook.Hour < 0 || webhook.Hour > 23 {
		return fmt.Errorf("hour must be between 0 and 23")
	}
	if webhook.Minute < 0 || webhook.Minute > 59 {
		return fmt.Errorf("minute must be between 0 and 59")
	}
	if webhook.Frequency == "weekly" && (webhook.Day < 0 || webhook.Day > 6) {
		return fmt.Errorf("day must be 0..6 (0=Sunday..6=Saturday) for weekly frequency")
	}
	if len(webhook.Repositories) == 0 {
		// Push all repositories if no repositories are specified
		repositories, err := models.GetRepositoriesFromConfig()
		if err != nil {
			return err
		}
		webhook.Repositories = make([]string, len(repositories))
		for i, repo := range repositories {
			webhook.Repositories[i] = repo.ID
		}
	}
	if webhook.Active {
		webhook.NextRunAt = calculateNextRunAt(webhook)
	} else {
		webhook.NextRunAt = time.Time{}
	}

	return nil
}

// Init custom gnolove webhook, that sends to Samourai Coop Discord
func InitCustomGnoloveWebhook(db *gorm.DB) error {
	var webhook models.LeaderboardWebhook
	db.First(&webhook, "url = ?", os.Getenv("DISCORD_WEBHOOK_URL"))
	if webhook.ID != 0 {
		return nil
	}
	customWebhook := models.LeaderboardWebhook{
		Url:       os.Getenv("DISCORD_WEBHOOK_URL"),
		Type:      "discord",
		Frequency: "weekly",
		Day:       4,
		Hour:      15,
		Minute:    0,
		Active:    true,
	}
	customWebhook.NextRunAt = calculateNextRunAt(&customWebhook)
	if err := db.Create(&customWebhook).Error; err != nil {
		return err
	}
	return nil
}

// Get a user's leaderboard webhooks
func HandleGetLeaderboardWebhooks(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Unauthorized"))
			return
		}
		userID := claims.Subject
		var webhooks []models.LeaderboardWebhook
		err := db.Where("user_id = ?", userID).Find(&webhooks).Error
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		json.NewEncoder(w).Encode(webhooks)
	}
}

// Create a leaderboard webhook for the user
func HandleCreateLeaderboardWebhook(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Unauthorized"))
			return
		}
		userID := claims.Subject
		var webhook models.LeaderboardWebhook
		err := json.NewDecoder(r.Body).Decode(&webhook)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		webhook.UserID = userID
		err = checkWebhookInput(&webhook)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		err = db.Create(&webhook).Error
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(webhook)
	}
}

// Update a leaderboard webhook for the user
func HandleUpdateLeaderboardWebhook(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Unauthorized"))
			return
		}
		userID := claims.Subject
		id := chi.URLParam(r, "id")
		var webhook models.LeaderboardWebhook
		err := db.First(&webhook, id).Error
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte("Webhook not found"))
			return
		}
		if webhook.UserID != userID {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Unauthorized"))
			return
		}
		err = json.NewDecoder(r.Body).Decode(&webhook)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		err = checkWebhookInput(&webhook)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		err = db.Save(&webhook).Error
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		json.NewEncoder(w).Encode(webhook)
	}
}

// Delete a leaderboard webhook for the user
func HandleDeleteLeaderboardWebhook(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Unauthorized"))
			return
		}
		userID := claims.Subject
		id := chi.URLParam(r, "id")
		var webhook models.LeaderboardWebhook
		err := db.First(&webhook, id).Error
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte("Webhook not found"))
			return
		}
		if webhook.UserID != userID {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Unauthorized"))
			return
		}
		err = db.Delete(&webhook).Error
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

// Loop through active leaderboard webhooks and trigger them
func LoopTriggerLeaderboardWebhooks(db *gorm.DB) {
	for {
		time.Sleep(1 * time.Minute)
		var webhooks []models.LeaderboardWebhook
		err := db.Where("active = ? AND next_run_at <= ?", true, time.Now()).Find(&webhooks).Error
		if err != nil {
			fmt.Println("Failed to find webhooks", err)
			continue
		}
		for i := range webhooks {
			webhook := webhooks[i]
			err := TriggerLeaderboardWebhook(db, webhook)
			if err != nil {
				fmt.Println("Failed to send leaderboard webhook", err)
				continue
			}
			webhook.NextRunAt = calculateNextRunAt(&webhook)
			err = db.Save(&webhook).Error
			if err != nil {
				fmt.Println("Failed to update NextRunAt", err)
			}
		}
	}
}
