package models

import "time"

type Commit struct {
	ID        string `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	AuthorID  string
	Url       string
	Author    *User
}
