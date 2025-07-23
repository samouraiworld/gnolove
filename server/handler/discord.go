package handler

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
)

type ContributorStats struct {
	Login        string
	Name         string
	AvatarUrl    string
	TotalCommits int
	TotalPRs     int
	TotalIssues  int
	TotalScore   int
}

func getTopContributors(db *gorm.DB, limit int) ([]ContributorStats, error) {
	// Get data from last week
	startTime := time.Now().AddDate(0, 0, -7)

	// Get all users with their contributions
	users := make([]models.User, 0)
	err := db.Model(&models.User{}).
		Preload("Commits", func(db *gorm.DB) *gorm.DB {
			return db.Where("created_at > ?", startTime).Order("created_at DESC")
		}).
		Preload("PullRequests", func(db *gorm.DB) *gorm.DB {
			return db.Where("created_at > ?", startTime).Order("created_at DESC")
		}).
		Preload("Issues", func(db *gorm.DB) *gorm.DB {
			return db.Where("created_at > ?", startTime).Order("created_at DESC")
		}).
		Find(&users).Error

	if err != nil {
		return nil, err
	}

	// Calculate stats for each user
	stats := make([]ContributorStats, 0, len(users))
	for _, user := range users {
		totalCommits := len(user.Commits)
		totalPRs := len(user.PullRequests)
		totalIssues := len(user.Issues)
		totalScore := totalCommits + totalPRs + totalIssues

		// Only include users who have made contributions
		if totalScore > 0 {
			stats = append(stats, ContributorStats{
				Login:        user.Login,
				Name:         user.Name,
				AvatarUrl:    user.AvatarUrl,
				TotalCommits: totalCommits,
				TotalPRs:     totalPRs,
				TotalIssues:  totalIssues,
				TotalScore:   totalScore,
			})
		}
	}

	// Sort by total score (descending)
	sort.Slice(stats, func(i, j int) bool {
		return stats[i].TotalScore > stats[j].TotalScore
	})

	// Limit to requested number
	if len(stats) > limit {
		stats = stats[:limit]
	}

	return stats, nil
}

func formatLeaderboardMessage(contributors []ContributorStats) string {
	if len(contributors) == 0 {
		return "No contributions found in the last week! 😢"
	}

	message := "🏆 **Weekly Contributor Leaderboard** 🏆\n\n"

	// Emojis for podium positions
	podiumEmojis := []string{"🥇", "🥈", "🥉"}

	for i, contributor := range contributors {
		// Use podium emoji if available, otherwise use position number
		position := ""
		if i < len(podiumEmojis) {
			position = podiumEmojis[i]
		} else {
			position = fmt.Sprintf("%d.", i+1)
		}

		// Use name if available, otherwise use login
		displayName := contributor.Login
		if contributor.Name != "" {
			displayName = contributor.Name
		}

		// Format the contributor's stats
		message += fmt.Sprintf("%s **%s** - **%d** points\n", position, displayName, contributor.TotalScore)
		message += fmt.Sprintf("   💻 %d commits • 🔀 %d PRs • 🐛 %d issues\n\n",
			contributor.TotalCommits, contributor.TotalPRs, contributor.TotalIssues)
	}

	message += "\nKeep up the great work! 🚀"
	return message
}

func HandleDiscordNotification(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Get top 3 contributors from the last week
		contributors, err := getTopContributors(db, 3)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("error getting top contributors: %v", err)})
			return
		}

		// Format the leaderboard message
		content := formatLeaderboardMessage(contributors)

		// Discord configuration
		webhookURL := os.Getenv("DISCORD_WEBHOOK_URL")

		payload := map[string]string{
			"content": content,
		}

		body, _ := json.Marshal(payload)

		resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(body))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("error posting to webhook: %v", err)})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 300 {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("discord returned status: %d", resp.StatusCode)})
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"success": "true", "message": content})
	}
}
