package sync

import (
	"os"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// SeedSystemLeaderboardConfig ensures there is a system-owned LeaderboardConfig
// that mirrors the previous hardcoded cron: Discord, weekly, Friday 15:00 UTC.
func SeedSystemLeaderboardConfig(db *gorm.DB, logger *zap.SugaredLogger) error {
	webhook := os.Getenv("DISCORD_WEBHOOK_URL")
	if webhook == "" {
		return nil
	}

	// Upsert by reserved system user id
	const systemUser = "system"

	var existing models.LeaderboardConfig
	err := db.Where("user_id = ?", systemUser).First(&existing).Error
	loc := time.UTC
	now := time.Now().In(loc)
	anchor := time.Date(now.Year(), now.Month(), now.Day(), 15, 0, 0, 0, loc)
	for anchor.Weekday() != time.Friday || anchor.Before(now) {
		anchor = anchor.AddDate(0, 0, 1)
		if anchor.Hour() != 15 || anchor.Minute() != 0 {
			anchor = time.Date(anchor.Year(), anchor.Month(), anchor.Day(), 15, 0, 0, 0, loc)
		}
	}

	cfg := models.LeaderboardConfig{
		UserID:               systemUser,
		Platform:             "discord",
		WebhookURL:           webhook,
		SelectedRepositories: "",          // all repos by default (env exclusion still applies)
		Timeline:             "last_week", // keep weekly window
		Frequency:            "weekly",
		AnchorAt:             &anchor,
		Timezone:             "UTC",
		Active:               true,
	}

	if err == nil {
		// Update existing record to match current env/webhook and schedule
		existing.Platform = cfg.Platform
		existing.WebhookURL = cfg.WebhookURL
		existing.SelectedRepositories = cfg.SelectedRepositories
		existing.Timeline = cfg.Timeline
		existing.Frequency = cfg.Frequency
		existing.AnchorAt = cfg.AnchorAt
		existing.Timezone = cfg.Timezone
		existing.Active = cfg.Active
		if uerr := db.Save(&existing).Error; uerr != nil {
			return uerr
		}
		logger.Infof("Updated system leaderboard config (id=%d)", existing.ID)
		return nil
	}

	if uerr := db.Create(&cfg).Error; uerr != nil {
		return uerr
	}
	logger.Infof("Created system leaderboard config")
	return nil
}
