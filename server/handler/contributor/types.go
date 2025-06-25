package contributor

// TimeCount represents a count for a given period (day, month, etc)
type TimeCount struct {
	Period string `json:"period"`
	Count  int    `json:"count"`
}

type recentActivity struct {
	Title      string `json:"title"`
	URL        string `json:"url"`
	CreatedAt  string `json:"createdAt"`
	Repository string `json:"repository"`
	Type       string `json:"type"`
}

type repoInfo struct {
	NameWithOwner   string `json:"nameWithOwner"`
	Description     string `json:"description"`
	URL             string `json:"url"`
	StargazerCount  int    `json:"stargazerCount"`
	PrimaryLanguage string `json:"primaryLanguage"`
}

type repoInfoWithContributions struct {
	ID            string `json:"id"`
	Contributions int    `json:"contributions"`
}

type githubUserResponse struct {
	ContributionsPerDay        []TimeCount                 `json:"contributionsPerDay"`
	ID                         string                      `json:"id"`
	Login                      string                      `json:"login"`
	AvatarUrl                  string                      `json:"avatarUrl"`
	URL                        string                      `json:"url"`
	Name                       string                      `json:"name"`
	Bio                        string                      `json:"bio"`
	Location                   string                      `json:"location"`
	JoinDate                   string                      `json:"joinDate"`
	WebsiteUrl                 string                      `json:"websiteUrl"`
	TwitterUsername            string                      `json:"twitterUsername"`
	TotalStars                 int                         `json:"totalStars"`
	TotalRepos                 int                         `json:"totalRepos"`
	Followers                  int                         `json:"followers"`
	Following                  int                         `json:"following"`
	TotalCommits               int                         `json:"totalCommits"`
	TotalPullRequests          int                         `json:"totalPullRequests"`
	TotalIssues                int                         `json:"totalIssues"`
	RecentIssues               []recentActivity            `json:"recentIssues"`
	RecentPullRequests         []recentActivity            `json:"recentPullRequests"`
	TopRepositories            []repoInfo                  `json:"topRepositories"`
	Wallet                     string                      `json:"wallet"`
	GnoBalance                 string                      `json:"gnoBalance"`
	CommitsPerMonth            []TimeCount                 `json:"commitsPerMonth"`
	PullRequestsPerMonth       []TimeCount                 `json:"pullRequestsPerMonth"`
	IssuesPerMonth             []TimeCount                 `json:"issuesPerMonth"`
	TopContributedRepositories []repoInfoWithContributions `json:"topContributedRepositories"`
}
