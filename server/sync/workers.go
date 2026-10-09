package sync

import (
	"context"
	stdsync "sync"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
)

// syncRepositoriesConcurrently fans out repository-level work across a pool
// of workers (sized by SYNC_WORKERS, default 4). Pre-Phase-2a this loop was
// sequential and would have started to brush GitHub's GraphQL rate limit
// once the curated ~50-repo allowlist lands in Phase 2b (plan R-1).
//
// Each repo's GraphQL passes are wrapped in exponential backoff so a single
// rate-limit hiccup doesn't drop a repo from the cycle.
func (s *Syncer) syncRepositoriesConcurrently(ctx context.Context) {
	workers := syncWorkerCount()
	repoCh := make(chan models.Repository)
	var wg stdsync.WaitGroup

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for repo := range repoCh {
				if ctx.Err() != nil {
					return
				}
				if repo.Status != "unavailable" {
					s.syncOneRepo(ctx, repo, workerID)
				}
			}
		}(i)
	}

	for _, r := range s.repositories {
		select {
		case <-ctx.Done():
			close(repoCh)
			wg.Wait()
			return
		case repoCh <- r:
		}
	}
	close(repoCh)
	wg.Wait()
}

// syncOneRepo runs the five per-repository sync passes for a single repo,
// each wrapped in rate-limit backoff. A failure in one pass is logged but
// doesn't skip the rest — partial progress is better than none.
func (s *Syncer) syncOneRepo(ctx context.Context, repo models.Repository, workerID int) {
	s.logger.Infof("[worker %d] sync starting for %s", workerID, repo.ID)
	if err := backoffRetry(ctx, defaultBackoffAttempts, defaultBackoffBase, isRetryableGitHubErr, func() error { return s.syncRepositoryMetadata(ctx, repo) }); err != nil {
		// An unattested repo cannot expose prior data when metadata reads fail.
		if updateErr := s.db.Model(&models.Repository{}).Where("id = ?", repo.ID).Updates(map[string]interface{}{"public": false, "sync_error": "GitHub metadata unavailable"}).Error; updateErr != nil {
			s.logger.Errorf("repository visibility checkpoint %s: %v", repo.ID, updateErr)
		}
		s.clearPublicCache()
		s.logger.Errorf("repository metadata %s: %v", repo.ID, err)
		return
	}
	failed := false

	steps := []struct {
		name string
		fn   func() error
	}{
		{"users", func() error { return s.syncUsers(repo) }},
		{"issues", func() error { return s.syncIssues(repo) }},
		{"prs", func() error { return s.syncPRs(repo) }},
		{"milestones", func() error { return s.syncMilestones(repo) }},
		{"commits", func() error { return s.syncCommits(repo) }},
	}
	for _, step := range steps {
		if ctx.Err() != nil {
			return
		}
		err := backoffRetry(ctx, defaultBackoffAttempts, defaultBackoffBase, isRetryableGitHubErr, step.fn)
		if err != nil {
			failed = true
			s.logger.Errorf("[worker %d] %s sync %s failed: %v", workerID, repo.ID, step.name, err)
		}
	}
	fields := map[string]interface{}{"sync_error": ""}
	if failed {
		fields["sync_error"] = "Contribution sync incomplete"
	} else {
		fields["last_synced_at"] = time.Now().UTC()
	}
	if err := s.db.Model(&models.Repository{}).Where("id = ?", repo.ID).Updates(fields).Error; err != nil {
		s.logger.Errorf("repository checkpoint %s: %v", repo.ID, err)
	}

}
