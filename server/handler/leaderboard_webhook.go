package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/robfig/cron/v3"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"

	"github.com/go-chi/chi/v5"
)

func checkWebhookInput(webhook *models.LeaderboardWebhook) error {
	if webhook.Type != "discord" && webhook.Type != "slack" {
		return fmt.Errorf("invalid type")
	}
	if webhook.Url == "" {
		return fmt.Errorf("url is required")
	}
	_, err := url.ParseRequestURI(webhook.Url)
	if err != nil {
		return fmt.Errorf("invalid url")
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
	if webhook.Cron == "" {
		// Default to Friday 15:00 UTC
		webhook.Cron = "0 15 * * 5"
	} else {
		_, err := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow).Parse(webhook.Cron)
		if err != nil {
			return fmt.Errorf("invalid cron expression")
		}
	}
	return nil
}

func enableCronJob(scheduler *cron.Cron, webhook models.LeaderboardWebhook, database *gorm.DB) (cron.EntryID, error) {
	id, err := scheduler.AddFunc(webhook.Cron, func() {
		TriggerLeaderboardWebhook(database, webhook)
	})
	if err != nil {
		return 0, err
	}
	return id, nil
}

func disableCronJob(scheduler *cron.Cron, webhook models.LeaderboardWebhook) {
	scheduler.Remove(webhook.CronId)
}

// Init custom gnolove webhook, that sends to Samourai Discord
func InitCustomGnoloveWebhook(db *gorm.DB, scheduler *cron.Cron) error {
	var webhook models.LeaderboardWebhook
	db.First(&webhook, "url = ?", os.Getenv("DISCORD_WEBHOOK_URL"))
	if webhook.ID != 0 {
		return nil
	}
	customWebhook := models.LeaderboardWebhook{
		Url:    os.Getenv("DISCORD_WEBHOOK_URL"),
		Type:   "discord",
		Cron:   "0 15 * * 5",
		Active: true,
	}
	id, err := enableCronJob(scheduler, customWebhook, db)
	if err != nil {
		return err
	}
	customWebhook.CronId = id
	if err := db.Create(&customWebhook).Error; err != nil {
		return err
	}
	return nil
}

// Init cron jobs for all active webhooks on server startup
func InitActiveLeaderboardWebhooks(db *gorm.DB, scheduler *cron.Cron) error {
	webhooks := []models.LeaderboardWebhook{}
	err := db.Find(&webhooks).Where("active = ?", true).Error
	if err != nil {
		return err
	}

	for _, wh := range webhooks {
		id, err := enableCronJob(scheduler, wh, db)
		if err != nil {
			return err
		}

		wh.CronId = id
		if err := db.Save(&wh).Error; err != nil {
			return err
		}
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
func HandleCreateLeaderboardWebhook(db *gorm.DB, scheduler *cron.Cron) http.HandlerFunc {
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
		id, err := enableCronJob(scheduler, webhook, db)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		webhook.CronId = id
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
func HandleUpdateLeaderboardWebhook(db *gorm.DB, scheduler *cron.Cron) http.HandlerFunc {
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
		if webhook.Active {
			if webhook.CronId != 0 {
				id, err := enableCronJob(scheduler, webhook, db)
				if err != nil {
					w.WriteHeader(http.StatusInternalServerError)
					w.Write([]byte(err.Error()))
					return
				}
				webhook.CronId = id
			}
		} else {
			disableCronJob(scheduler, webhook)
			webhook.CronId = 0
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
func HandleDeleteLeaderboardWebhook(db *gorm.DB, scheduler *cron.Cron) http.HandlerFunc {
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
		disableCronJob(scheduler, webhook)
		w.WriteHeader(http.StatusOK)
	}
}
