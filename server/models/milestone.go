package models

import "time"

type Milestone struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	RepositoryID string    `json:"repositoryID"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	Number       int       `json:"number"`
	Title        string    `json:"title"`
	State        string    `json:"state"`
	AuthorID     string    `json:"authorID"`
	Author       User      `json:"author"`
	Description  string    `json:"description"`
	Url          string    `json:"URL"`
	Issues       []Issue   `json:"issues"`
}
