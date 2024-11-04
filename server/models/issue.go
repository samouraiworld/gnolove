package models

import (
	"time"

	"github.com/lib/pq"
)

type Issue struct {
	CreatedAt time.Time
	UpdatedAt time.Time
	ID        string
	Number    int
	State     string
	Title     string
	AuthorID  string
	Author    User
	Labels    pq.StringArray `gorm:"type:text[]"`
}
