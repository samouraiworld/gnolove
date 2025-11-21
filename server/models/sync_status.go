package models

import "time"

type SyncStatus struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	LastSyncedAt time.Time `json:"lastSyncedAt"`
}
