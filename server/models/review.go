package models

import "time"

type Review struct {
	ID            string
	AuthorID      string
	PullRequestID string
	CreatedAt     time.Time

	PullRequest PullRequest
	Author      User
}
