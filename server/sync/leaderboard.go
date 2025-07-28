package sync

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sort"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
	"github.com/samouraiworld/topofgnomes/server/handler"
)

// ContributorStats holds stats and score for a contributor
type ContributorStats struct {
	UserID        string
	Login         string
	Name          string
	TotalCommits  int64
	TotalIssues   int64
	TotalPRs      int64
	TotalReviewed int64
	Score         float64
}

// Get contributors with stats and scores for the given period
func GetContributorsWithScores(db *gorm.DB, since time.Time) ([]ContributorStats, error) {
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		return nil, err
	}

	stats := make([]ContributorStats, 0, len(users))
	for _, user := range users {
		var commits, issues, prs, reviewed int64

		db.Table("commits").Where("author_id = ? AND created_at >= ?", user.ID, since).Count(&commits)
		db.Table("issues").Where("author_id = ? AND created_at >= ?", user.ID, since).Count(&issues)
		db.Table("pull_requests").Where("author_id = ? AND created_at >= ?", user.ID, since).Count(&prs)
		db.Table("reviews").Where("author_id = ? AND created_at >= ?", user.ID, since).Count(&reviewed)

		score := handler.CalculateScore(commits, issues, prs, reviewed)
		if score > 0 {
			stats = append(stats, ContributorStats{
				UserID:        user.ID,
				Login:         user.Login,
				Name:          user.Name,
				TotalCommits:  commits,
				TotalIssues:   issues,
				TotalPRs:      prs,
				TotalReviewed: reviewed,
				Score:         score,
			})
		}
	}

	// Sort by score descending
	sort.Slice(stats, func(i, j int) bool {
		return stats[i].Score > stats[j].Score
	})
	return stats, nil
}

// Format leaderboard message for Discord (same as frontend)
func FormatLeaderboardMessage(stats []ContributorStats) string {
	if len(stats) == 0 {
		return "No contributions found in the last week! 😢"
	}
	message := "🏆 **Weekly Contributor Leaderboard** 🏆\n\n"
	podiumEmojis := []string{"🥇", "🥈", "🥉"}
	for i, c := range stats {
		var position string
		if i < len(podiumEmojis) {
			position = podiumEmojis[i]
		} else {
			position = fmt.Sprintf("%d.", i+1)
		}
		displayName := c.Name
		if displayName == "" {
			displayName = c.Login
		}
		message += fmt.Sprintf("%s **%s** - **%.0f** points\n   💻 %d commits • 🔀 %d PRs • 🐛 %d issues\n\n",
			position, displayName, c.Score, c.TotalCommits, c.TotalPRs, c.TotalIssues)
		if i == 9 {
			break
		}
	}
	message += "\nKeep up the great work! 🚀"
	return message
}

// Send leaderboard to Discord webhook
func SendDiscordLeaderboard(webhookURL, content string) error {
	payload := map[string]string{"content": content}
	b, _ := json.Marshal(payload)
	resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(b))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("discord webhook returned status %d", resp.StatusCode)
	}
	return nil
}

// Cron job: send weekly leaderboard to Discord
func (s *Syncer) StartLeaderboardNotifier() {
	// Schedule: Friday 15:00 UTC (0 15 * * 5)
	go func() {
		for {
			now := time.Now().UTC()
			next := time.Date(now.Year(), now.Month(), now.Day(), 15, 0, 0, 0, time.UTC)
			for next.Weekday() != time.Friday || !next.After(now) {
				next = next.Add(24 * time.Hour)
			}
			d := next.Sub(now)
			time.Sleep(d)
			// Run job
			oneWeekAgo := next.AddDate(0, 0, -7)
			stats, err := GetContributorsWithScores(s.db, oneWeekAgo)
			if err != nil {
				s.logger.Errorf("Leaderboard cron: %v", err)
				continue
			}
			msg := FormatLeaderboardMessage(stats)
			webhookURL := os.Getenv("DISCORD_WEBHOOK_URL")
			if webhookURL == "" {
				s.logger.Error("DISCORD_WEBHOOK_URL not set")
				continue
			}
			err = SendDiscordLeaderboard(webhookURL, msg)
			if err != nil {
				s.logger.Errorf("Failed to send Discord leaderboard: %v", err)
			} else {
				s.logger.Info("Sent Discord leaderboard successfully")
			}
		}
	}()
}
