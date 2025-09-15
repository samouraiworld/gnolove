package sync

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

	"github.com/samouraiworld/topofgnomes/server/handler"
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

// GetContributorsWithScoresFiltered returns contributors with scores, filtered by an optional include list of repositories (owner/name).
// If includeRepos is non-empty, only activity from those repos are counted. Otherwise, falls back to the environment exclusion logic.
func GetContributorsWithScoresFiltered(db *gorm.DB, since time.Time, includeRepos []string) ([]ContributorStats, error) {
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		return nil, err
	}

	// If includeRepos provided, transform to a set for quick checks
	includeSet := map[string]struct{}{}
	for _, r := range includeRepos {
		r = strings.TrimSpace(r)
		if r == "" {
			continue
		}
		includeSet[r] = struct{}{}
	}

	// Build excluded repositories slice from env var (backward compatibility)
	excludedEnv := os.Getenv("LEADERBOARD_EXCLUDED_REPOS")
	var excludedRepos []string
	if strings.TrimSpace(excludedEnv) == "" {
		excludedRepos = []string{"samouraiworld/gnomonitoring"}
	} else {
		parts := strings.FieldsFunc(excludedEnv, func(r rune) bool { return r == ',' || r == ' ' || r == '\n' || r == '\t' })
		for _, p := range parts {
			if s := strings.TrimSpace(p); s != "" {
				excludedRepos = append(excludedRepos, s)
			}
		}
	}

	type countResult struct {
		AuthorID string
		Count    int64
	}

	// Helper to apply filters
	applyFilters := func(q *gorm.DB) *gorm.DB {
		q = q.Where("created_at >= ?", since)
		if len(includeSet) > 0 {
			// repository_id is stored as "owner/name"
			repos := make([]string, 0, len(includeSet))
			for r := range includeSet {
				repos = append(repos, r)
			}
			q = q.Where("repository_id IN ?", repos)
		} else if len(excludedRepos) > 0 {
			q = q.Where("repository_id NOT IN ?", excludedRepos)
		}
		return q
	}

	commitsMap := map[string]int64{}
	var commitResults []countResult
	{
		q := db.Table("commits").Select("author_id, COUNT(*) as count")
		q = applyFilters(q)
		if err := q.Group("author_id").Scan(&commitResults).Error; err != nil {
			return nil, err
		}
	}
	for _, r := range commitResults {
		commitsMap[r.AuthorID] = r.Count
	}

	issuesMap := map[string]int64{}
	var issueResults []countResult
	{
		q := db.Table("issues").Select("author_id, COUNT(*) as count")
		q = applyFilters(q)
		if err := q.Group("author_id").Scan(&issueResults).Error; err != nil {
			return nil, err
		}
	}
	for _, r := range issueResults {
		issuesMap[r.AuthorID] = r.Count
	}

	prsMap := map[string]int64{}
	var prResults []countResult
	{
		q := db.Table("pull_requests").Select("author_id, COUNT(*) as count")
		q = applyFilters(q)
		if err := q.Group("author_id").Scan(&prResults).Error; err != nil {
			return nil, err
		}
	}
	for _, r := range prResults {
		prsMap[r.AuthorID] = r.Count
	}

	reviewedMap := map[string]int64{}
	var reviewedResults []countResult
	{
		q := db.Table("reviews").Select("author_id, COUNT(*) as count")
		q = applyFilters(q)
		if err := q.Group("author_id").Scan(&reviewedResults).Error; err != nil {
			return nil, err
		}
	}
	for _, r := range reviewedResults {
		reviewedMap[r.AuthorID] = r.Count
	}

	stats := make([]ContributorStats, 0, len(users))
	for _, user := range users {
		commits := commitsMap[user.ID]
		issues := issuesMap[user.ID]
		prs := prsMap[user.ID]
		reviewed := reviewedMap[user.ID]
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

	sort.Slice(stats, func(i, j int) bool { return stats[i].Score > stats[j].Score })
	return stats, nil
}

// ParseTimeline returns the start time for a human-friendly timeline key.
func ParseTimeline(now time.Time, timeline string) time.Time {
	switch strings.ToLower(strings.TrimSpace(timeline)) {
	case "last week", "last_week", "week", "weekly":
		return now.AddDate(0, 0, -7)
	case "last two weeks", "last_two_weeks", "2w", "biweekly":
		return now.AddDate(0, 0, -14)
	case "last month", "last_month", "month", "monthly":
		return now.AddDate(0, -1, 0)
	default:
		return now.AddDate(0, 0, -7)
	}
}

// (intentionally left blank in this hunk; duplicate removed below where helpers are defined)

// Get contributors with stats and scores for the given period
func GetContributorsWithScores(db *gorm.DB, since time.Time) ([]ContributorStats, error) {
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		return nil, err
	}

	// Build excluded repositories slice from env var (comma or space separated)
	excludedEnv := os.Getenv("LEADERBOARD_EXCLUDED_REPOS")
	var excludedRepos []string
	if strings.TrimSpace(excludedEnv) == "" {
		// Default exclusion
		excludedRepos = []string{"samouraiworld/gnomonitoring"}
	} else {
		parts := strings.FieldsFunc(excludedEnv, func(r rune) bool { return r == ',' || r == ' ' || r == '\n' || r == '\t' })
		for _, p := range parts {
			if s := strings.TrimSpace(p); s != "" {
				excludedRepos = append(excludedRepos, s)
			}
		}
	}

	// Aggregate all counts in one query per table
	type countResult struct {
		AuthorID string
		Count    int64
	}
	commitsMap := map[string]int64{}
	var commitResults []countResult
	{
		q := db.Table("commits").Select("author_id, COUNT(*) as count").Where("created_at >= ?", since)
		if len(excludedRepos) > 0 {
			q = q.Where("repository_id NOT IN ?", excludedRepos)
		}
		if err := q.Group("author_id").Scan(&commitResults).Error; err != nil {
			return nil, err
		}
	}
	for _, r := range commitResults {
		commitsMap[r.AuthorID] = r.Count
	}

	issuesMap := map[string]int64{}
	var issueResults []countResult
	{
		q := db.Table("issues").Select("author_id, COUNT(*) as count").Where("created_at >= ?", since)
		if len(excludedRepos) > 0 {
			q = q.Where("repository_id NOT IN ?", excludedRepos)
		}
		if err := q.Group("author_id").Scan(&issueResults).Error; err != nil {
			return nil, err
		}
	}
	for _, r := range issueResults {
		issuesMap[r.AuthorID] = r.Count
	}

	prsMap := map[string]int64{}
	var prResults []countResult
	{
		q := db.Table("pull_requests").Select("author_id, COUNT(*) as count").Where("created_at >= ?", since)
		if len(excludedRepos) > 0 {
			q = q.Where("repository_id NOT IN ?", excludedRepos)
		}
		if err := q.Group("author_id").Scan(&prResults).Error; err != nil {
			return nil, err
		}
	}
	for _, r := range prResults {
		prsMap[r.AuthorID] = r.Count
	}

	reviewedMap := map[string]int64{}
	var reviewedResults []countResult
	{
		q := db.Table("reviews").Select("author_id, COUNT(*) as count").Where("created_at >= ?", since)
		if len(excludedRepos) > 0 {
			q = q.Where("repository_id NOT IN ?", excludedRepos)
		}
		if err := q.Group("author_id").Scan(&reviewedResults).Error; err != nil {
			return nil, err
		}
	}
	for _, r := range reviewedResults {
		reviewedMap[r.AuthorID] = r.Count
	}

	// Now build the stats slice
	stats := make([]ContributorStats, 0, len(users))
	for _, user := range users {
		commits := commitsMap[user.ID]
		issues := issuesMap[user.ID]
		prs := prsMap[user.ID]
		reviewed := reviewedMap[user.ID]
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
	// Add a concise legend so the scoring is explicit for users
	// Uses factors from handler/score.go to stay consistent with backend logic
	message += fmt.Sprintf("Scoring: 💻×%.0f + 🔀×%.0f + 🐛×%.1f + 🧐×%.0f\n\n",
		handler.CommitFactor, handler.PRFactor, handler.IssueFactor, handler.ReviewedPRFactor)
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

// Send leaderboard to Discord webhook
func SendDiscordLeaderboard(webhookURL, content string) error {
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

// Send leaderboard to Slack webhook
func SendSlackLeaderboard(webhookURL, content string) error {
	payload := map[string]string{"text": content}
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
		return fmt.Errorf("slack webhook returned status %d", resp.StatusCode)
	}
	return nil
}

// Send leaderboard to a webhook
func SendLeaderboardWebhook(platform, webhookURL, content string) error {
	switch strings.ToLower(platform) {
	case "slack":
		return SendSlackLeaderboard(webhookURL, content)
	case "discord":
		return SendDiscordLeaderboard(webhookURL, content)
	default:
		return fmt.Errorf("unsupported platform: %s", platform)
	}
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
