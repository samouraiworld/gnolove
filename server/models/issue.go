package models

import (
	"time"
)

type Issue struct {
	CreatedAt   time.Time
	UpdatedAt   time.Time
	ID          string
	Number      int
	State       string
	Title       string
	AuthorID    string
	Author      *User
	Labels      []Label `gorm:"many2many:issue_labels"`
	MilestoneID string
	URL         string
	Assignees   []Assignee `gorm:"many2many:issue_assignees"`
}

type Assignee struct {
	ID      uint `gorm:"primaryKey"`
	UserID  string
	IssueID string
	User    *User
}

type Label struct {
	ID    uint `gorm:"primaryKey"`
	Name  string
	Color string
}
