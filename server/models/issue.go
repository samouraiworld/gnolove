package models

import (
	"time"
)

type Issue struct {
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
	ID           string     `json:"id"`
	RepositoryID string     `json:"repositoryID"`
	Number       int        `json:"number"`
	State        string     `json:"state"`
	Title        string     `json:"title"`
	AuthorID     string     `json:"authorID"`
	Author       *User      `json:"author"`
	Labels       []Label    `gorm:"many2many:issue_labels" json:"labels"`
	MilestoneID  string     `json:"milestoneID"`
	URL          string     `json:"URL"`
	Assignees    []Assignee `gorm:"many2many:issue_assignees" json:"assignees"`
}

type Assignee struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	UserID  string `json:"userID"`
	IssueID string `json:"issueID"`
	User    *User  `json:"user"`
}

type Label struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
}
