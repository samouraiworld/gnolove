package models

import "time"

type LeaderboardWebhook struct {
	ID           uint      `gorm:"primarykey;autoIncrement" json:"id"`
	Url          string    `json:"url"`
	UserID       string    `json:"userId"`
	Type         string    `gorm:"column:type;not null;check:type IN ('discord','slack')" json:"type"`
	Cron         string    `gorm:"column:cron;not null" json:"cron"`
	Repositories []string  `gorm:"column:repositories;type:text;serializer:json" json:"repositories"`
	Active       bool      `gorm:"column:active;not null;default:true" json:"active"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
}
