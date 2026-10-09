package sync

import (
	"context"
	"errors"
	"fmt"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/shurcooL/githubv4"
	"strings"
	"time"
)

var errPrivateRepository = errors.New("repository is private")

func (s *Syncer) syncRepositoryMetadata(ctx context.Context, repo models.Repository) error {
	var q struct {
		Repository struct {
			NameWithOwner    string
			IsPrivate        bool
			IsArchived       bool
			Description      string
			StargazerCount   int
			PrimaryLanguage  *struct{ Name string }
			PushedAt         *githubv4.DateTime
			DefaultBranchRef *struct{ Name string }
		} `graphql:"repository(owner: $owner, name: $name)"`
	}
	err := s.client.Query(ctx, &q, map[string]interface{}{"owner": githubv4.String(repo.Owner), "name": githubv4.String(repo.Name)})
	if err != nil {
		return err
	}
	meta := q.Repository
	if meta.IsPrivate {
		if err := s.db.Model(&models.Repository{}).Where("id = ?", repo.ID).Updates(map[string]interface{}{"public": false, "status": "private"}).Error; err != nil {
			return err
		}
		s.clearPublicCache()
		return errPrivateRepository
	}
	if !strings.EqualFold(meta.NameWithOwner, repo.ID) {
		return fmt.Errorf("repository renamed; registry update required")
	}
	if meta.DefaultBranchRef == nil || meta.DefaultBranchRef.Name != repo.BaseBranch {
		return fmt.Errorf("default branch changed; registry update required")
	}
	fields := map[string]interface{}{"public": true, "stars": meta.StargazerCount, "description": meta.Description, "status": "active", "language": ""}
	if meta.IsArchived {
		fields["status"] = "archived"
	} else if meta.PushedAt != nil && time.Since(meta.PushedAt.Time) > 90*24*time.Hour {
		fields["status"] = "inactive"
	}
	if meta.PushedAt != nil {
		fields["pushed_at"] = meta.PushedAt.Time
	}
	if meta.PrimaryLanguage != nil {
		fields["language"] = meta.PrimaryLanguage.Name
	}
	return s.db.Model(&models.Repository{}).Where("id = ?", repo.ID).Updates(fields).Error
}

// Every contribution page carries isPrivate so a visibility change during a
// long backfill stops ingestion, rather than waiting for the next cycle.
func (s *Syncer) checkRepositoryVisibility(repo models.Repository, private bool) error {
	if !private {
		return nil
	}
	if err := s.db.Model(&models.Repository{}).Where("id = ?", repo.ID).Updates(map[string]interface{}{"public": false, "status": "private"}).Error; err != nil {
		return err
	}
	s.clearPublicCache()
	return errPrivateRepository
}

// SetPublicCacheInvalidator keeps previously cached public activity from being
// served after a repository loses its public visibility.
func (s *Syncer) SetPublicCacheInvalidator(fn func()) { s.invalidatePublicCache = fn }
func (s *Syncer) clearPublicCache() {
	if s.invalidatePublicCache != nil {
		s.invalidatePublicCache()
	}
}
