package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"gorm.io/gorm"
)

type TimeCount struct {
	Period string `json:"period"`
	Count  int    `json:"count"`
}

type githubUserResponse struct {
	ContributionsPerDay []TimeCount `json:"contributionsPerDay"` // Daily contributions for heatmap

	ID                 string           `json:"id"`
	Login              string           `json:"login"`
	AvatarUrl          string           `json:"avatarUrl"`
	URL                string           `json:"url"`
	Name               string           `json:"name"`
	Bio                string           `json:"bio"`
	Location           string           `json:"location"`
	JoinDate           string           `json:"joinDate"`
	WebsiteUrl         string           `json:"websiteUrl"`
	TwitterUsername    string           `json:"twitterUsername"`
	TotalStars         int              `json:"totalStars"`
	TotalRepos         int              `json:"totalRepos"`
	Followers          int              `json:"followers"`
	Following          int              `json:"following"`
	TotalCommits       int              `json:"totalCommits"`
	TotalPullRequests  int              `json:"totalPullRequests"`
	TotalIssues        int              `json:"totalIssues"`
	RecentIssues       []recentActivity `json:"recentIssues"`
	RecentPullRequests []recentActivity `json:"recentPullRequests"`
	TopRepositories    []topRepository  `json:"topRepositories"`
	Wallet             string           `json:"wallet"`
	GnoBalance         string           `json:"gnoBalance"`

	CommitsPerMonth      []TimeCount `json:"commitsPerMonth"`
	PullRequestsPerMonth []TimeCount `json:"pullRequestsPerMonth"`
	IssuesPerMonth       []TimeCount `json:"issuesPerMonth"`
}

type recentActivity struct {
	Title      string `json:"title"`
	URL        string `json:"url"`
	CreatedAt  string `json:"createdAt"`
	Repository string `json:"repository"`
	Type       string `json:"type"`
}

type topRepository struct {
	NameWithOwner   string `json:"nameWithOwner"`
	Description     string `json:"description"`
	URL             string `json:"url"`
	StargazerCount  int    `json:"stargazerCount"`
	PrimaryLanguage string `json:"primaryLanguage"`
}

func HandleGetContributor(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var err error
		var resp githubUserResponse
		log.Printf("[Contributor Handler] Request for: %s", r.URL.Path)
		login := strings.TrimPrefix(r.URL.Path, "/contributors/")
		log.Printf("[Contributor Handler] Extracted login from URL.Path: '%s'", login)
		if login == "" {
			http.Error(w, "Missing user login", http.StatusBadRequest)
			return
		}

		// Lookup user from DB (all fields)
		var dbUser struct {
			ID              string
			Login           string
			AvatarUrl       string
			URL             string
			Name            string
			Bio             string
			Location        string
			JoinDate        *time.Time
			WebsiteUrl      string
			TwitterUsername string
			TotalStars      int
			TotalRepos      int
			Followers       int
			Following       int
			Wallet          string
		}
		err = db.Table("users").Select("id, login, avatar_url, url, name, bio, location, join_date, website_url, twitter_username, total_stars, total_repos, followers, following, wallet").Where("login = ?", login).Scan(&dbUser).Error
		if err != nil {
			log.Printf("[Contributor Handler] DB error for login %s: %v", login, err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		if dbUser.Login == "" {
			log.Printf("[Contributor Handler] No user found in DB for login: %s", login)
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		log.Printf("[Contributor Handler] Querying DB for user: %s...", login)

		// Fetch stats from DB
		// --- Time-bucketed analytics ---
		// Helper: get YYYY-MM for last 12 months
		months := make([]string, 12)
		now := time.Now()
		for i := 0; i < 12; i++ {
			m := now.AddDate(0, -i, 0)
			months[11-i] = m.Format("2006-01")
		}

		// Commits per month
		var commitCounts []struct {
			Period string
			Count  int
		}
		db.Raw(`SELECT strftime('%Y-%m', created_at) as period, COUNT(*) as count FROM commits WHERE author_id = ? AND created_at >= ? GROUP BY period`, dbUser.ID, now.AddDate(0, -12, 0)).Scan(&commitCounts)
		commitMap := map[string]int{}
		for _, c := range commitCounts {
			commitMap[c.Period] = c.Count
		}
		commitsPerMonth := make([]TimeCount, 12)
		for i, m := range months {
			commitsPerMonth[i] = TimeCount{Period: m, Count: commitMap[m]}
		}

		// PRs per month
		var prCounts []struct {
			Period string
			Count  int
		}
		db.Raw(`SELECT strftime('%Y-%m', created_at) as period, COUNT(*) as count FROM pull_requests WHERE author_id = ? AND created_at >= ? GROUP BY period`, dbUser.ID, now.AddDate(0, -12, 0)).Scan(&prCounts)
		prMap := map[string]int{}
		for _, c := range prCounts {
			prMap[c.Period] = c.Count
		}
		prsPerMonth := make([]TimeCount, 12)
		for i, m := range months {
			prsPerMonth[i] = TimeCount{Period: m, Count: prMap[m]}
		}

		// Issues per month
		var issueCounts []struct {
			Period string
			Count  int
		}
		db.Raw(`SELECT strftime('%Y-%m', created_at) as period, COUNT(*) as count FROM issues WHERE author_id = ? AND created_at >= ? GROUP BY period`, dbUser.ID, now.AddDate(0, -12, 0)).Scan(&issueCounts)
		issueMap := map[string]int{}
		for _, c := range issueCounts {
			issueMap[c.Period] = c.Count
		}
		issuesPerMonth := make([]TimeCount, 12)
		for i, m := range months {
			issuesPerMonth[i] = TimeCount{Period: m, Count: issueMap[m]}
		}

		// Daily contributions for heatmap (commits + PRs + issues per day)
		var dailyCounts []struct {
			Period string
			Count  int
		}
		// TODO: Optimize this query if slow
		db.Raw(`
			SELECT strftime('%Y-%m-%d', created_at) as period, COUNT(*) as count FROM (
				SELECT created_at FROM commits WHERE author_id = ? AND created_at >= ?
				UNION ALL
				SELECT created_at FROM pull_requests WHERE author_id = ? AND created_at >= ?
				UNION ALL
				SELECT created_at FROM issues WHERE author_id = ? AND created_at >= ?
			) GROUP BY period
		`, dbUser.ID, now.AddDate(-1, 0, 0), dbUser.ID, now.AddDate(-1, 0, 0), dbUser.ID, now.AddDate(-1, 0, 0)).Scan(&dailyCounts)
		dailyMap := map[string]int{}
		for _, c := range dailyCounts {
			dailyMap[c.Period] = c.Count
		}
		days := []string{}
		start := now.AddDate(-1, 0, 0)
		for i := 0; i < 365; i++ {
			date := start.AddDate(0, 0, i).Format("2006-01-02")
			days = append(days, date)
		}
		contributionsPerDay := make([]TimeCount, 365)
		for i, d := range days {
			contributionsPerDay[i] = TimeCount{Period: d, Count: dailyMap[d]}
		}

		var totalCommits, totalPRs, totalIssues int64
		if err := db.Table("commits").Where("author_id = ?", dbUser.ID).Count(&totalCommits).Error; err != nil {
			log.Printf("[Contributor Handler] DB error counting commits for user %s: %v", dbUser.ID, err)
		}
		if err := db.Table("pull_requests").Where("author_id = ?", dbUser.ID).Count(&totalPRs).Error; err != nil {
			log.Printf("[Contributor Handler] DB error counting PRs for user %s: %v", dbUser.ID, err)
		}
		if err := db.Table("issues").Where("author_id = ?", dbUser.ID).Count(&totalIssues).Error; err != nil {
			log.Printf("[Contributor Handler] DB error counting issues for user %s: %v", dbUser.ID, err)
		}

		// Fetch recent issues from DB
		var recentIssues []struct {
			Title        string
			URL          string
			CreatedAt    time.Time
			RepositoryID string
		}
		if err := db.Table("issues").Select("title, url, created_at, repository_id").Where("author_id = ?", dbUser.ID).Order("created_at desc").Limit(3).Scan(&recentIssues).Error; err != nil {
			log.Printf("[Contributor Handler] DB error fetching issues for user %s: %v", dbUser.ID, err)
		}

		// Fetch recent pull requests from DB
		var recentPRs []struct {
			Title        string
			URL          string
			CreatedAt    time.Time
			RepositoryID string
		}
		if err := db.Table("pull_requests").Select("title, url, created_at, repository_id").Where("author_id = ?", dbUser.ID).Order("created_at desc").Limit(3).Scan(&recentPRs).Error; err != nil {
			log.Printf("[Contributor Handler] DB error fetching pull requests for user %s: %v", dbUser.ID, err)
		}

		// Fetch repository names for issues and PRs from DB
		repoNames := make(map[string]string)
		repoIDs := make(map[string]struct{})
		for _, i := range recentIssues {
			repoIDs[i.RepositoryID] = struct{}{}
		}
		for _, pr := range recentPRs {
			repoIDs[pr.RepositoryID] = struct{}{}
		}
		if len(repoIDs) > 0 {
			var repos []struct {
				ID            string
				NameWithOwner string
			}
			var ids []string
			for id := range repoIDs {
				ids = append(ids, id)
			}
			if err := db.Table("repositories").Select("id, name").Where("id IN ?", ids).Scan(&repos).Error; err != nil {
				log.Printf("[Contributor Handler] DB error fetching repositories for user %s: %v", dbUser.ID, err)
			}
			for _, r := range repos {
				repoNames[r.ID] = r.NameWithOwner
			}
		}

		resp = githubUserResponse{
			ID:        dbUser.ID,
			Login:     dbUser.Login,
			AvatarUrl: dbUser.AvatarUrl,
			URL:       dbUser.URL,
			Name:      dbUser.Name,
			Bio:       dbUser.Bio,
			Location:  dbUser.Location,
			JoinDate: func() string {
				if dbUser.JoinDate != nil {
					return dbUser.JoinDate.Format(time.RFC3339)
				}
				return ""
			}(),
			WebsiteUrl:      dbUser.WebsiteUrl,
			TwitterUsername: dbUser.TwitterUsername,
			TotalStars:      dbUser.TotalStars,
			TotalRepos:      dbUser.TotalRepos,
			Followers:       dbUser.Followers,
			Following:       dbUser.Following,

			TotalCommits:      int(totalCommits),
			TotalPullRequests: int(totalPRs),
			TotalIssues:       int(totalIssues),
			RecentIssues: func() []recentActivity {
				var out []recentActivity
				for _, n := range recentIssues {
					out = append(out, recentActivity{
						Title:      n.Title,
						URL:        n.URL,
						CreatedAt:  n.CreatedAt.Format(time.RFC3339),
						Repository: repoNames[n.RepositoryID],
						Type:       "issue",
					})
				}
				return out
			}(),
			RecentPullRequests: func() []recentActivity {
				var out []recentActivity
				for _, n := range recentPRs {
					out = append(out, recentActivity{
						Title:      n.Title,
						URL:        n.URL,
						CreatedAt:  n.CreatedAt.Format(time.RFC3339),
						Repository: repoNames[n.RepositoryID],
						Type:       "pull_request",
					})
				}
				return out
			}(),
			TopRepositories: func() []topRepository {
				// Not available from DB yet, return empty array instead of nil
				return []topRepository{}
			}(),
			Wallet:     dbUser.Wallet,
			GnoBalance: "0",

			CommitsPerMonth:      commitsPerMonth,
			PullRequestsPerMonth: prsPerMonth,
			IssuesPerMonth:       issuesPerMonth,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("[Contributor Handler] Error encoding response for user %s: %v", login, err)
		} else {
			log.Printf("[Contributor Handler] Response sent for user: %s", login)
		}
	}
}
