package models

import (
	"time"
)

type LeaderboardWebhook struct {
	ID           uint      `gorm:"primarykey;autoIncrement" json:"id"`
	Url          string    `json:"url"`
	UserID       string    `json:"userId"`
	Type         string    `gorm:"column:type;not null;check:type IN ('discord','slack')" json:"type" default:"discord"`
	Frequency    string    `gorm:"column:frequency;not null;check:frequency IN ('daily','weekly')" json:"frequency" default:"weekly"`
	Day          int       `gorm:"column:day;not null;check:day >= 0 AND day <= 6" json:"day" default:"4"`
	Hour         int       `gorm:"column:hour;not null" json:"hour" default:"15"`
	Minute       int       `gorm:"column:minute;not null" json:"minute" default:"0"`
	Timezone     string    `gorm:"column:timezone;not null" json:"timezone" default:"Europe/Paris"`
	Repositories []string  `gorm:"column:repositories;type:text;serializer:json" json:"repositories"`
	Active       bool      `gorm:"column:active;not null;default:true" json:"active" default:"true"`
	NextRunAt    time.Time `gorm:"column:next_run_at;not null" json:"nextRunAt"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
}
