package gormrepo

import (
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/repository"
	"gorm.io/gorm"
)

type GormPullRequestRepository struct {
	DB *gorm.DB
}

func NewPullRequestRepository(db *gorm.DB) *GormPullRequestRepository {
	return &GormPullRequestRepository{DB: db}
}

var _ repository.PullRequestRepository = (*GormPullRequestRepository)(nil)

func (r *GormPullRequestRepository) FindForReport(start, end time.Time) ([]models.PullRequest, error) {
	var prs []models.PullRequest
	err := r.DB.Model(&models.PullRequest{}).
		Preload("Author").
		Preload("Reviews").
		Where("(created_at >= ? AND created_at <= ?) OR (created_at < ? AND state = 'OPEN')", start, end, start).
		Find(&prs).Error
	return prs, err
}
