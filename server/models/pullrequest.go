package models

import "time"

type PullRequest struct {
	CreatedAt    time.Time `json:"createdAt" gorm:"index:idx_pull_requests_author_created,priority:2"`
	UpdatedAt    time.Time `json:"updatedAt"`
	ID           string    `json:"id"`
	RepositoryID string    `json:"repositoryID" gorm:"index"`
	Number       int       `json:"number"`
	State        string    `json:"state"`
	Title        string    `json:"title"`
	AuthorID     string    `json:"authorID" gorm:"index;index:idx_pull_requests_author_created,priority:1"`
	Author       *User     `json:"author"`
	Reviews      []Review  `json:"reviews"`
	MilestoneID  string    `json:"milestoneID"`
	URL          string    `json:"URL"`
}
