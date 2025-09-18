package models

import (
	"time"

	"github.com/robfig/cron/v3"
)

type LeaderboardWebhook struct {
	ID           uint         `gorm:"primarykey;autoIncrement" json:"id"`
	Url          string       `json:"url"`
	UserID       string       `json:"userId"`
	Type         string       `gorm:"column:type;not null;check:type IN ('discord','slack')" json:"type"`
	Cron         string       `gorm:"column:cron;not null" json:"cron"`
	CronId       cron.EntryID `gorm:"column:cron_id;not null" json:"cronId"`
	Repositories []string     `gorm:"column:repositories;type:text;serializer:json" json:"repositories"`
	Active       bool         `gorm:"column:active;not null;default:true" json:"active"`
	CreatedAt    time.Time    `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time    `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
}
