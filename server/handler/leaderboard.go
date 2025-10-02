package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
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

// Get contributors with stats and scores for the given period and repositories
func GetContributorsWithScores(db *gorm.DB, since time.Time, repositories []string) ([]ContributorStats, error) {
	var users []models.User

	// Build excluded repositories slice from env var (comma separated)
	excludedEnv := os.Getenv("LEADERBOARD_EXCLUDED_REPOS")
	var excludedRepos []string
	if strings.TrimSpace(excludedEnv) == "" {
		// Default exclusion
		excludedRepos = []string{"samouraiworld/gnomonitoring"}
	} else {
		parts := strings.FieldsFunc(excludedEnv, func(r rune) bool { return r == ',' })
		for _, p := range parts {
			if s := strings.TrimSpace(p); s != "" {
				excludedRepos = append(excludedRepos, s)
			}
		}
	}

	// Preload associations with conditions (since + repositories filters)
	cond := func(tx *gorm.DB) *gorm.DB {
		tx2 := tx.Where("created_at >= ?", since)
		if len(excludedRepos) > 0 {
			tx2 = tx2.Where("repository_id NOT IN ?", excludedRepos)
		}
		if len(repositories) > 0 {
			tx2 = tx2.Where("repository_id IN ?", repositories)
		}
		return tx2
	}

	// Retrieve users with data based on conditions
	err := db.Model(&models.User{}).
		Preload("Issues", cond).
		Preload("Commits", cond).
		Preload("PullRequests", cond).
		Preload("Reviews", func(tx *gorm.DB) *gorm.DB {
			scoped := cond(tx)
			return scoped.
				Joins("JOIN pull_requests ON pull_requests.id = reviews.pull_request_id").
				Where("pull_requests.state = ?", "MERGED").
				Where("pull_requests.author_id <> reviews.author_id")
		}).
		Find(&users).Error

	if err != nil {
		return nil, err
	}

	// Now build the stats slice
	stats := make([]ContributorStats, 0, len(users))
	for _, user := range users {
		commits := int64(len(user.Commits))
		issues := int64(len(user.Issues))
		prs := int64(len(user.PullRequests))
		reviewed := int64(len(user.Reviews))
		score := CalculateScore(commits, issues, prs, reviewed)
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

// Format leaderboard message for Discord / Slack (same as frontend)
func FormatLeaderboardMessage(stats []ContributorStats) string {
	if len(stats) == 0 {
		return "No contributions found in the last week! 😢"
	}
	message := "🏆 **Weekly Contributor Leaderboard** 🏆\n\n"
	// Add a concise legend so the scoring is explicit for users
	// Uses factors from handler/score.go to stay consistent with backend logic
	message += fmt.Sprintf("Scoring: 💻×%.0f + 🔀×%.0f + 🐛×%.1f + 🧐×%.0f\n\n",
		CommitFactor, PRFactor, IssueFactor, ReviewedPRFactor)
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
		userLink := fmt.Sprintf("[**%s**](https://gnolove.world/@%s)", displayName, url.QueryEscape(c.Login))
		message += fmt.Sprintf("%s %s - **%.0f** points\n   💻 %d commits • 🔀 %d PRs • 🐛 %d issues • 🧐 %d reviews\n\n",
			position, userLink, c.Score, c.TotalCommits, c.TotalPRs, c.TotalIssues, c.TotalReviewed)
		if i == 9 {
			break
		}
	}
	message += "\nKeep up the great work! 🚀\n\nSee the full leaderboard on [gnolove.world](https://gnolove.world/?f=weekly)"
	return message
}

// Send leaderboard to webhook
func SendLeaderboard(webhookURL, content string) error {
	payload := map[string]string{"content": content}
	b, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Post(webhookURL, "application/json", bytes.NewBuffer(b))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("discord webhook returned status %d", resp.StatusCode)
	}
	return nil
}

// Cron job: send weekly leaderboard to Discord / Slack
func TriggerLeaderboardWebhook(db *gorm.DB, webhook models.LeaderboardWebhook) error {
	// Compute since date based on frequency of webhook
	now := time.Now()
	var since time.Time
	switch webhook.Frequency {
	case "daily":
		since = now.AddDate(0, 0, -1)
	case "weekly":
		since = now.AddDate(0, 0, -7)
	default:
		since = now.AddDate(0, 0, -7)
	}
	stats, err := GetContributorsWithScores(db, since, webhook.Repositories)
	if err != nil {
		return fmt.Errorf("%v", err)
	}
	msg := FormatLeaderboardMessage(stats)
	err = SendLeaderboard(webhook.Url, msg)
	if err != nil {
		return fmt.Errorf("%v", err)
	}
	return nil
}
