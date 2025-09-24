package models

import "time"

// Report is your database model (already present).
type Report struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	Data      string    `json:"data" gorm:"type:json"`
}
