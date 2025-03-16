package models

import "time"

type Commit struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	AuthorID     string    `json:"authorID" gorm:"index"`
	Title        string    `json:"title"`
	URL          string    `json:"URL" `
	Author       *User     `json:"author"`
	RepositoryID string    `json:"repositoryID" gorm:"index"`
}
