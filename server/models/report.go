package models

import "time"

type Report struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	GeneratedAt time.Time `json:"generatedAt"`
	Data        string    `json:"data" gorm:"type:json"`
}
