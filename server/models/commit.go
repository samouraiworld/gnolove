package models

import "time"

type Commit struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	CreatedAt    time.Time `json:"createdAt" gorm:"index:idx_commits_author_created,priority:2"`
	UpdatedAt    time.Time `json:"updatedAt"`
	AuthorID     string    `json:"authorID" gorm:"index;index:idx_commits_author_created,priority:1"`
	Title        string    `json:"title"`
	URL          string    `json:"URL" `
	Author       *User     `json:"author"`
	RepositoryID string    `json:"repositoryID" gorm:"index"`
}
