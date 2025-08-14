package repository

import (
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
)

type PullRequestRepository interface {
	FindForReport(start, end time.Time) ([]models.PullRequest, error)
}
