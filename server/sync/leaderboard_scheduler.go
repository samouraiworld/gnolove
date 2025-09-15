package sync

import (
	"strings"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
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
			nr := computeNextRunWithAnchor(cfg.AnchorAt, cfg.Timezone, now, cfg.Frequency)
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
			next := computeNextRunWithAnchor(cfg.AnchorAt, cfg.Timezone, now, cfg.Frequency)
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

		next := computeNextRunWithAnchor(cfg.AnchorAt, cfg.Timezone, now, cfg.Frequency)
		_ = s.db.Model(&models.LeaderboardConfig{}).Where("id = ?", cfg.ID).Updates(map[string]interface{}{
			"next_run_at": next,
			"last_run_at": now,
		}).Error
	}
}

// computeNextRunWithAnchor computes the next run time (in UTC) based on an optional anchor time and timezone.
// If anchorAt is nil, falls back to simple interval from `from`.
func computeNextRunWithAnchor(anchorAt *time.Time, tz string, from time.Time, frequency string) time.Time {
	freq := strings.ToLower(strings.TrimSpace(frequency))
	if tz == "" {
		tz = "UTC"
	}
	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc = time.UTC
	}

	if anchorAt == nil {
		// Fallback to simple interval from current time
		switch freq {
		case "daily":
			return from.Add(24 * time.Hour)
		case "biweekly", "two_weeks", "2w":
			return from.AddDate(0, 0, 14)
		case "monthly", "month":
			return from.AddDate(0, 1, 0)
		case "weekly", "week":
			fallthrough
		default:
			return from.AddDate(0, 0, 7)
		}
	}

	// Align to the next occurrence of the anchor in the user's timezone
	nowLocal := from.In(loc)
	anchorLocal := anchorAt.In(loc)

	// Build a candidate time today at anchor clock (hour/min/sec) and weekday/day-of-month logic
	candidate := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), anchorLocal.Hour(), anchorLocal.Minute(), anchorLocal.Second(), 0, loc)

	switch freq {
	case "daily":
		if !candidate.After(nowLocal) {
			candidate = candidate.Add(24 * time.Hour)
		}
	case "weekly", "week":
		// Move to the same weekday as anchor
		for candidate.Weekday() != anchorLocal.Weekday() || !candidate.After(nowLocal) {
			candidate = candidate.AddDate(0, 0, 1)
		}
	case "biweekly", "two_weeks", "2w":
		// Next weekly occurrence, then ensure an even 2-week step relative to anchor reference
		for candidate.Weekday() != anchorLocal.Weekday() || !candidate.After(nowLocal) {
			candidate = candidate.AddDate(0, 0, 1)
		}
		// If the number of weeks since anchor isn't even, add one more week
		weeks := int(candidate.Sub(anchorLocal).Hours() / (24 * 7))
		if weeks%2 != 0 {
			candidate = candidate.AddDate(0, 0, 7)
		}
	case "monthly", "month":
		// Target the same day-of-month and time
		targetDay := anchorLocal.Day()
		// If today before target or at target but clock passed, move to next month
		if nowLocal.Day() > targetDay || (nowLocal.Day() == targetDay && !candidate.After(nowLocal)) {
			// next month
			y, m := nowLocal.Year(), nowLocal.Month()
			m++
			if m > 12 {
				y++
				m = 1
			}
			// clamp day to last day of next month
			lastDay := lastDayOfMonth(y, m)
			if targetDay > lastDay {
				targetDay = lastDay
			}
			candidate = time.Date(y, m, targetDay, anchorLocal.Hour(), anchorLocal.Minute(), anchorLocal.Second(), 0, loc)
		} else {
			// this month at target day
			lastDay := lastDayOfMonth(nowLocal.Year(), nowLocal.Month())
			if targetDay > lastDay {
				targetDay = lastDay
			}
			candidate = time.Date(nowLocal.Year(), nowLocal.Month(), targetDay, anchorLocal.Hour(), anchorLocal.Minute(), anchorLocal.Second(), 0, loc)
			if !candidate.After(nowLocal) {
				// move to next month if still not after
				y, m := nowLocal.Year(), nowLocal.Month()
				m++
				if m > 12 {
					y++
					m = 1
				}
				lastDay := lastDayOfMonth(y, m)
				if targetDay > lastDay {
					targetDay = lastDay
				}
				candidate = time.Date(y, m, targetDay, anchorLocal.Hour(), anchorLocal.Minute(), anchorLocal.Second(), 0, loc)
			}
		}
	default:
		// default weekly
		for candidate.Weekday() != anchorLocal.Weekday() || !candidate.After(nowLocal) {
			candidate = candidate.AddDate(0, 0, 1)
		}
	}

	return candidate.UTC()
}

func lastDayOfMonth(year int, month time.Month) int {
	// Move to the first day of the next month, then subtract one day
	t := time.Date(year, month+1, 1, 0, 0, 0, 0, time.UTC)
	t = t.Add(-24 * time.Hour)
	return t.Day()
}
