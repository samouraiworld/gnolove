package models

import "time"

type PullRequest struct {
	CreatedAt   time.Time
	UpdatedAt   time.Time
	ID          string
	Number      int
	State       string
	Title       string
	AuthorID    string
	Author      *User
	Reviews     []Review
	MilestoneID string
}
