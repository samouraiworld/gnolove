package models

import "time"

type Review struct {
	ID            string    `gorm:"primaryKey" json:"id"`
	RepositoryID  string    `json:"repositoryID" gorm:"index"`
	AuthorID      string    `json:"authorID" gorm:"index"`
	PullRequestID string    `json:"pullRequestID"`
	CreatedAt     time.Time `json:"createdAt"`

	PullRequest *PullRequest `json:"pullRequest"`
	Author      *User        `json:"author"`
}
