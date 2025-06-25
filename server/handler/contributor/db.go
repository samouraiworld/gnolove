package contributor

import (
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

type contributorDBUser struct {
	ID              string
	Login           string
	AvatarUrl       string
	URL             string
	Name            string
	Wallet          string
	Bio             string
	Location        string
	JoinDate        time.Time
	WebsiteUrl      string
	TwitterUsername string
	TotalStars      int
	TotalRepos      int
	Followers       int
	Following       int
}

type contributorDBResponse struct {
	ContributionsPerDay        []TimeCount
	TotalCommits               int
	TotalPullRequests          int
	TotalIssues                int
	RecentIssues               []recentActivity
	RecentPullRequests         []recentActivity
	CommitsPerMonth            []TimeCount
	PullRequestsPerMonth       []TimeCount
	IssuesPerMonth             []TimeCount
	TopContributedRepositories []repoInfoWithContributions
}

func GetContributorDataFromDatabase(db *gorm.DB, login string) (contributorDBResponse, contributorDBUser, error) {
	dbUser, err := getUser(db, login)
	if err != nil {
		return contributorDBResponse{}, dbUser, err
	}

	if dbUser.Login == "" {
		return contributorDBResponse{}, dbUser, errors.New("user not found")
	}

	var userID string
	db.Table("users").Select("id").Where("login = ?", login).Scan(&userID)

	commitsPerMonth, prsPerMonth, issuesPerMonth := getMonthlyCounts(db, userID)
	contributionsPerDay := getDailyContributions(db, userID)
	recentIssues, recentPRs := getRecentActivities(db, userID)
	repoNames := getRepoNames(db, recentIssues, recentPRs)

	recentIssuesOut := formatRecentActivities(recentIssues, repoNames, "issue")
	recentPRsOut := formatRecentActivities(recentPRs, repoNames, "pull_request")

	totalCommits, totalPRs, totalIssues := getTotalCounts(db, userID)

	topRepos := getTopContributedRepositories(db, userID)

	return contributorDBResponse{
		ContributionsPerDay:        contributionsPerDay,
		TotalCommits:               int(totalCommits),
		TotalPullRequests:          int(totalPRs),
		TotalIssues:                int(totalIssues),
		RecentIssues:               recentIssuesOut,
		RecentPullRequests:         recentPRsOut,
		CommitsPerMonth:            commitsPerMonth,
		PullRequestsPerMonth:       prsPerMonth,
		IssuesPerMonth:             issuesPerMonth,
		TopContributedRepositories: topRepos,
	}, dbUser, nil
}

func getUser(db *gorm.DB, login string) (contributorDBUser, error) {
	var dbUser contributorDBUser
	err := db.Table("users").Select("id, login, avatar_url, url, name, wallet, bio, location, join_date, website_url, twitter_username, total_stars, total_repos, followers, following").Where("login = ?", login).Scan(&dbUser).Error
	return dbUser, err
}

func getMonthlyCounts(db *gorm.DB, userID string) ([]TimeCount, []TimeCount, []TimeCount) {
	now := time.Now()
	months := make([]string, 12)
	for i := 0; i < 12; i++ {
		m := now.AddDate(0, -i, 0)
		months[11-i] = m.Format("2006-01")
	}

	var commitCounts []struct {
		Period string
		Count  int
	}
	db.Raw(`SELECT strftime('%Y-%m', created_at) as period, COUNT(*) as count FROM commits WHERE author_id = ? AND created_at >= ? GROUP BY period`, userID, now.AddDate(0, -12, 0)).Scan(&commitCounts)
	commitMap := map[string]int{}
	for _, c := range commitCounts {
		commitMap[c.Period] = c.Count
	}
	commitsPerMonth := make([]TimeCount, 12)
	for i, m := range months {
		commitsPerMonth[i] = TimeCount{Period: m, Count: commitMap[m]}
	}

	var prCounts []struct {
		Period string
		Count  int
	}
	db.Raw(`SELECT strftime('%Y-%m', created_at) as period, COUNT(*) as count FROM pull_requests WHERE author_id = ? AND created_at >= ? GROUP BY period`, userID, now.AddDate(0, -12, 0)).Scan(&prCounts)
	prMap := map[string]int{}
	for _, c := range prCounts {
		prMap[c.Period] = c.Count
	}
	prsPerMonth := make([]TimeCount, 12)
	for i, m := range months {
		prsPerMonth[i] = TimeCount{Period: m, Count: prMap[m]}
	}

	var issueCounts []struct {
		Period string
		Count  int
	}
	db.Raw(`SELECT strftime('%Y-%m', created_at) as period, COUNT(*) as count FROM issues WHERE author_id = ? AND created_at >= ? GROUP BY period`, userID, now.AddDate(0, -12, 0)).Scan(&issueCounts)
	issueMap := map[string]int{}
	for _, c := range issueCounts {
		issueMap[c.Period] = c.Count
	}
	issuesPerMonth := make([]TimeCount, 12)
	for i, m := range months {
		issuesPerMonth[i] = TimeCount{Period: m, Count: issueMap[m]}
	}

	return commitsPerMonth, prsPerMonth, issuesPerMonth
}

func getDailyContributions(db *gorm.DB, userID string) []TimeCount {
	now := time.Now()
	days := []string{}
	start := now.AddDate(-1, 0, 0)
	for i := 0; i < 365; i++ {
		date := start.AddDate(0, 0, i).Format("2006-01-02")
		days = append(days, date)
	}

	var dailyCounts []struct {
		Period string
		Count  int
	}
	db.Raw(`
		SELECT strftime('%Y-%m-%d', created_at) as period, COUNT(*) as count FROM (
			SELECT created_at FROM commits WHERE author_id = ? AND created_at >= ?
			UNION ALL
			SELECT created_at FROM pull_requests WHERE author_id = ? AND created_at >= ?
			UNION ALL
			SELECT created_at FROM issues WHERE author_id = ? AND created_at >= ?
		) GROUP BY period
	`, userID, now.AddDate(-1, 0, 0), userID, now.AddDate(-1, 0, 0), userID, now.AddDate(-1, 0, 0)).Scan(&dailyCounts)
	dailyMap := map[string]int{}
	for _, c := range dailyCounts {
		dailyMap[c.Period] = c.Count
	}
	contributionsPerDay := make([]TimeCount, 365)
	for i, d := range days {
		contributionsPerDay[i] = TimeCount{Period: d, Count: dailyMap[d]}
	}

	return contributionsPerDay
}

func getRecentActivities(db *gorm.DB, userID string) ([]struct {
	Title        string
	URL          string
	CreatedAt    time.Time
	RepositoryID string
}, []struct {
	Title        string
	URL          string
	CreatedAt    time.Time
	RepositoryID string
}) {
	var recentIssues []struct {
		Title        string
		URL          string
		CreatedAt    time.Time
		RepositoryID string
	}
	if err := db.Table("issues").Select("title, url, created_at, repository_id").Where("author_id = ?", userID).Order("created_at desc").Limit(3).Scan(&recentIssues).Error; err != nil {
		recentIssues = []struct {
			Title        string
			URL          string
			CreatedAt    time.Time
			RepositoryID string
		}{}
	}

	var recentPRs []struct {
		Title        string
		URL          string
		CreatedAt    time.Time
		RepositoryID string
	}
	if err := db.Table("pull_requests").Select("title, url, created_at, repository_id").Where("author_id = ?", userID).Order("created_at desc").Limit(3).Scan(&recentPRs).Error; err != nil {
		recentPRs = []struct {
			Title        string
			URL          string
			CreatedAt    time.Time
			RepositoryID string
		}{}
	}

	return recentIssues, recentPRs
}

func getRepoNames(db *gorm.DB, recentIssues []struct {
	Title        string
	URL          string
	CreatedAt    time.Time
	RepositoryID string
}, recentPRs []struct {
	Title        string
	URL          string
	CreatedAt    time.Time
	RepositoryID string
}) map[string]string {
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
			Name          string
			Owner         string
			NameWithOwner string
		}
		var ids []string
		for id := range repoIDs {
			ids = append(ids, id)
		}
		if err := db.Table("repositories").Select("id, name, owner").Where("id IN ?", ids).Scan(&repos).Error; err == nil {
			repoNames := make(map[string]string)
			for i, r := range repos {
				repos[i].NameWithOwner = r.Owner + "/" + r.Name
				repoNames[r.ID] = repos[i].NameWithOwner
			}
			return repoNames
		}
	}
	return make(map[string]string)
}

// formatRecentActivities formats recent issues or PRs into []recentActivity
func formatRecentActivities(entries []struct {
	Title        string
	URL          string
	CreatedAt    time.Time
	RepositoryID string
}, repoNames map[string]string, activityType string) []recentActivity {
	out := make([]recentActivity, 0, len(entries))
	for _, n := range entries {
		out = append(out, recentActivity{
			Title:      n.Title,
			URL:        n.URL,
			CreatedAt:  n.CreatedAt.Format(time.RFC3339),
			Repository: repoNames[n.RepositoryID],
			Type:       activityType,
		})
	}
	return out
}

// getTopRepositories fetches the top 3 repositories the user owns, sorted by stargazer_count DESC
func getTopRepositories(db *gorm.DB, userLogin string) []repoInfo {
	var topReposJSON string
	db.Table("users").Select("top_repositories").Where("login = ?", userLogin).Scan(&topReposJSON)

	var repos []repoInfo
	if topReposJSON != "" {
		err := json.Unmarshal([]byte(topReposJSON), &repos)
		if err != nil {
			repos = make([]repoInfo, 0)
		}
	}
	if repos == nil {
		repos = make([]repoInfo, 0)
	}
	return repos
}

// getTopContributedRepositories fetches the top 3 repositories the user has contributed to, ordered by total authored activity
func getTopContributedRepositories(db *gorm.DB, userID string) []repoInfoWithContributions {
	type repoAgg struct {
		ID            string
		Contributions int
	}
	var repos []repoAgg
	query := `
		SELECT r.id,
			(
				SELECT COUNT(*) FROM commits c WHERE c.repository_id = r.id AND c.author_id = ?
				+
				SELECT COUNT(*) FROM pull_requests pr WHERE pr.repository_id = r.id AND pr.author_id = ?
				+
				SELECT COUNT(*) FROM issues i WHERE i.repository_id = r.id AND i.author_id = ?
			) as total_authored
		FROM repositories r
		ORDER BY total_authored DESC
		LIMIT 3
	`
	db.Raw(query, userID, userID, userID).Scan(&repos)
	var out []repoInfoWithContributions
	for _, r := range repos {
		if r.Contributions > 0 {
			out = append(out, repoInfoWithContributions(r))
		}
	}
	if out == nil {
		return make([]repoInfoWithContributions, 0)
	}
	return out
}

// getTotalCounts fetches total commits, PRs, and issues
func getTotalCounts(db *gorm.DB, userID string) (int64, int64, int64) {
	var totalCommits, totalPRs, totalIssues int64
	if err := db.Table("commits").Where("author_id = ?", userID).Count(&totalCommits).Error; err != nil {
		totalCommits = 0
	}
	if err := db.Table("pull_requests").Where("author_id = ?", userID).Count(&totalPRs).Error; err != nil {
		totalPRs = 0
	}
	if err := db.Table("issues").Where("author_id = ?", userID).Count(&totalIssues).Error; err != nil {
		totalIssues = 0
	}
	return totalCommits, totalPRs, totalIssues
}
