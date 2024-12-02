package models

import "time"

type Review struct {
	ID            string    `gorm:"primaryKey" json:"id"`
	AuthorID      string    `json:"authorID"`
	PullRequestID string    `json:"pullRequestID"`
	CreatedAt     time.Time `json:"createdAt"`

	PullRequest *PullRequest `json:"pullRequest"`
	Author      *User        `json:"author"`
}
