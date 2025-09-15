package models

import "time"

// LeaderboardConfig stores per-user configuration for webhook posting
// for contributor leaderboard notifications.
type LeaderboardConfig struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// Clerk user id stored in users table
	UserID string `gorm:"index;not null" json:"userId"`

	// Webhook destination
	Platform   string `gorm:"type:varchar(20);default:discord" json:"platform"` // "discord" | "slack"
	WebhookURL string `gorm:"type:text;not null" json:"webhookUrl"`

	// Comma-separated list of allowed repositories (owner/name). If empty, all repos.
	SelectedRepositories string `gorm:"type:text" json:"selectedRepositories"`

	// Timeline options: last_week, last_two_weeks, last_month
	Timeline string `gorm:"type:varchar(32);default:last_week" json:"timeline"`

	// Frequency options: daily, weekly, biweekly, monthly
	Frequency string `gorm:"type:varchar(32);default:weekly" json:"frequency"`

	// Anchor date/time and timezone for scheduling (user-chosen calendar time)
	// Example: Friday 15:00 in Europe/Paris, every week.
	AnchorAt *time.Time `json:"anchorAt"`
	Timezone string     `gorm:"type:varchar(64);default:UTC" json:"timezone"`

	// Scheduling
	Active    bool       `gorm:"default:true" json:"active"`
	NextRunAt *time.Time `json:"nextRunAt"`
	LastRunAt *time.Time `json:"lastRunAt"`
}
