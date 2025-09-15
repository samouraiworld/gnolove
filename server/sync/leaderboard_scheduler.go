package sync

import (
	"strings"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/schedule"
)

// StartPersonalLeaderboardScheduler starts a loop that periodically checks
// active LeaderboardConfig entries and posts the leaderboard accordingly.
func (s *Syncer) StartPersonalLeaderboardScheduler() {
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			s.runDueLeaderboardJobs()
		}
	}()
}

func (s *Syncer) runDueLeaderboardJobs() {
	var configs []models.LeaderboardConfig
	now := time.Now().UTC()
	if err := s.db.Where("active = ? AND (next_run_at IS NULL OR next_run_at <= ?)", true, now).Find(&configs).Error; err != nil {
		s.logger.Errorf("leaderboard scheduler: failed to load configs: %v", err)
		return
	}

	for i := range configs {
		cfg := configs[i]
		if cfg.WebhookURL == "" {
			continue
		}

		// Initialize NextRunAt if nil
		if cfg.NextRunAt == nil {
			nr := schedule.ComputeNextRunWithAnchor(cfg.AnchorAt, cfg.Timezone, now, cfg.Frequency)
			cfg.NextRunAt = &nr
			_ = s.db.Model(&models.LeaderboardConfig{}).Where("id = ?", cfg.ID).Update("next_run_at", nr).Error
			continue
		}

		// Skip if not yet due
		if cfg.NextRunAt.After(now) {
			continue
		}

		// Build include repos from SelectedRepositories
		var includeRepos []string
		if strings.TrimSpace(cfg.SelectedRepositories) != "" {
			parts := strings.FieldsFunc(cfg.SelectedRepositories, func(r rune) bool { return r == ',' || r == ' ' || r == '\n' || r == '\t' })
			for _, p := range parts {
				p = strings.TrimSpace(p)
				if p != "" {
					includeRepos = append(includeRepos, p)
				}
			}
		}

		since := ParseTimeline(now, cfg.Timeline)
		stats, err := GetContributorsWithScoresFiltered(s.db, since, includeRepos)
		if err != nil {
			s.logger.Errorf("leaderboard scheduler: stats error for cfg %d: %v", cfg.ID, err)
			next := schedule.ComputeNextRunWithAnchor(cfg.AnchorAt, cfg.Timezone, now, cfg.Frequency)
			_ = s.db.Model(&models.LeaderboardConfig{}).Where("id = ?", cfg.ID).Updates(map[string]interface{}{
				"next_run_at": next,
				"last_run_at": now,
			}).Error
			continue
		}

		msg := FormatLeaderboardMessage(stats)
		if err := SendLeaderboardWebhook(cfg.Platform, cfg.WebhookURL, msg); err != nil {
			s.logger.Errorf("leaderboard scheduler: send error for cfg %d: %v", cfg.ID, err)
		} else {
			s.logger.Infof("leaderboard scheduler: sent leaderboard for cfg %d", cfg.ID)
		}

		next := schedule.ComputeNextRunWithAnchor(cfg.AnchorAt, cfg.Timezone, now, cfg.Frequency)
		_ = s.db.Model(&models.LeaderboardConfig{}).Where("id = ?", cfg.ID).Updates(map[string]interface{}{
			"next_run_at": next,
			"last_run_at": now,
		}).Error
	}
}
