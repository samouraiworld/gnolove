package handler

import (
	"context"
	"os"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"go.uber.org/zap"
	"gorm.io/gorm"
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

// Loop through active leaderboard webhooks and trigger them
func LoopTriggerLeaderboardWebhooks(ctx context.Context, db *gorm.DB, logger *zap.SugaredLogger) {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			logger.Info("Leaderboard webhook loop stopped (context cancelled).")
			return
		case <-ticker.C:
		}
		var webhooks []models.LeaderboardWebhook
		err := db.Where("active AND next_run_at > ? AND next_run_at <= ?", time.Now().Add(-time.Minute), time.Now()).Find(&webhooks).Error
		if err != nil {
			logger.Error("Failed to find webhooks", err)
			continue
		}
		for i := range webhooks {
			webhook := webhooks[i]
			err := TriggerLeaderboardWebhook(db, webhook)
			if err != nil {
				logger.Error("Failed to send leaderboard webhook", err)
				continue
			}
			webhook.NextRunAt = calculateNextRunAt(&webhook)
			err = db.Save(&webhook).Error
			if err != nil {
				logger.Error("Failed to update NextRunAt", err)
			}
		}
	}
}
