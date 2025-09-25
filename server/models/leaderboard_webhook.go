package models

import (
	"time"
)

type LeaderboardWebhook struct {
	ID           uint      `gorm:"primarykey;autoIncrement" json:"id"`
	Url          string    `json:"url"`
	UserID       string    `json:"userId"`
	Type         string    `gorm:"column:type;not null;check:type IN ('discord','slack');default:'discord'" json:"type"`
	Frequency    string    `gorm:"column:frequency;not null;check:frequency IN ('daily','weekly');default:'weekly'" json:"frequency"`
	Day          int       `gorm:"column:day;not null;check:day >= 0 AND day <= 6;default:4" json:"day"`
	Hour         int       `gorm:"column:hour;not null;default:15" json:"hour"`
	Minute       int       `gorm:"column:minute;not null;default:0" json:"minute"`
	Timezone     string    `gorm:"column:timezone;not null;default:'Europe/Paris'" json:"timezone"`
	Repositories []string  `gorm:"column:repositories;type:text;serializer:json" json:"repositories"`
	Active       bool      `gorm:"column:active;not null;default:true" json:"active" default:"true"`
	NextRunAt    time.Time `gorm:"column:next_run_at;" json:"nextRunAt"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
}
