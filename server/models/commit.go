package models

import "time"

type Commit struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	AuthorID  string    `json:"authorID"`
	Url       string    `json:"URL" `
	Author    *User     `json:"author"`
}
