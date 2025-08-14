package repository

import (
	"github.com/samouraiworld/topofgnomes/server/infra/gormrepo"
	"github.com/samouraiworld/topofgnomes/server/repository"
	"gorm.io/gorm"
)

// NewPullRequestRepository constructs the default PullRequestRepository implementation.
// Keeping this in infra lets main depend only on the interface package while
// the concrete wiring stays in infra.
func NewPullRequestRepository(db *gorm.DB) repository.PullRequestRepository {
	return gormrepo.NewPullRequestRepository(db)
}
