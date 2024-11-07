package models

import "time"

type Milestone struct {
	ID          string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Number      int
	Title       string
	State       string
	AuthorID    string
	Author      User
	Description string
	Url         string
}
