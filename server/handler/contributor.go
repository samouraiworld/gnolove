package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/shurcooL/githubv4"
	"gorm.io/gorm"
)

type githubUserResponse struct {
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

type cachedUser struct {
	Data      githubUserResponse
	Timestamp time.Time
}

var (
	userCache   *ristretto.Cache
	cacheExpiry = 10 * time.Minute
)

func init() {
	cache, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: 1e4, // 10x max items
		MaxCost:     1e3, // max 1000 items
		BufferItems: 64,
	})
	if err != nil {
		log.Fatalf("Failed to initialize ristretto cache: %v", err)
	}
	userCache = cache
}

func HandleGetContributor(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var err error
		var resp githubUserResponse
		log.Printf("[Contributor Handler] Request for: %s", r.URL.Path)
		login := r.URL.Path
		if login == "" {
			http.Error(w, "Missing user login", http.StatusBadRequest)
			return
		}

		// Lookup login from DB
		var dbUser struct {
			Login  string
			Wallet string
		}
		err = db.Table("users").Select("login, wallet").Where("login = ?", login).Scan(&dbUser).Error
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

		// Check cache
		if val, found := userCache.Get(login); found {
			if cached, ok := val.(cachedUser); ok && time.Since(cached.Timestamp) < cacheExpiry {
				log.Printf("[Contributor Handler] Cache hit for user: %s", login)
				json.NewEncoder(w).Encode(cached.Data)
				return
			}
		}
		log.Printf("[Contributor Handler] Cache miss for user: %s. Querying GitHub API...", login)

		// Prepare GitHub client
		client := githubv4.NewClient(nil)

		var q struct {
			User struct {
				ID                  string
				Login               string
				AvatarUrl           string
				URL                 string
				Name                string
				Bio                 string
				Location            string
				CreatedAt           githubv4.DateTime
				WebsiteUrl          string
				TwitterUsername     string
				StarredRepositories struct {
					TotalCount int
				}
				Followers struct {
					TotalCount int
				}
				Following struct {
					TotalCount int
				}
				Repositories struct {
					TotalCount int
					Nodes      []struct {
						NameWithOwner   string
						Description     string
						URL             string
						StargazerCount  int
						PrimaryLanguage *struct {
							Name string
						}
					}
				} `graphql:"repositories(first: 3, privacy: PUBLIC, isFork: false, orderBy: {field: STARGAZERS, direction: DESC})"`
			} `graphql:"user(login: $login)"`
		}
		variables := map[string]interface{}{
			"login": githubv4.String(login),
		}
		err = client.Query(context.Background(), &q, variables)
		if err != nil {
			log.Printf("[Contributor Handler] GitHub API error for user %s: %v", login, err)
			http.Error(w, "GitHub API error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		log.Printf("[Contributor Handler] GitHub API success for user: %s", login)

		// Fetch stats from DB
		var totalCommits, totalPRs, totalIssues int64
		if err := db.Table("commits").Where("author_id = ?", q.User.ID).Count(&totalCommits).Error; err != nil {
			log.Printf("[Contributor Handler] DB error counting commits for user %s: %v", q.User.ID, err)
		}
		if err := db.Table("pull_requests").Where("author_id = ?", q.User.ID).Count(&totalPRs).Error; err != nil {
			log.Printf("[Contributor Handler] DB error counting pull requests for user %s: %v", q.User.ID, err)
		}
		if err := db.Table("issues").Where("author_id = ?", q.User.ID).Count(&totalIssues).Error; err != nil {
			log.Printf("[Contributor Handler] DB error counting issues for user %s: %v", q.User.ID, err)
		}

		// Fetch recent issues from DB
		var recentIssues []struct {
			Title        string
			URL          string
			CreatedAt    time.Time
			RepositoryID string
		}
		if err := db.Table("issues").Select("title, url, created_at, repository_id").Where("author_id = ?", q.User.ID).Order("created_at desc").Limit(3).Scan(&recentIssues).Error; err != nil {
			log.Printf("[Contributor Handler] DB error fetching issues for user %s: %v", q.User.ID, err)
		}

		// Fetch recent pull requests from DB
		var recentPRs []struct {
			Title        string
			URL          string
			CreatedAt    time.Time
			RepositoryID string
		}
		if err := db.Table("pull_requests").Select("title, url, created_at, repository_id").Where("author_id = ?", q.User.ID).Order("created_at desc").Limit(3).Scan(&recentPRs).Error; err != nil {
			log.Printf("[Contributor Handler] DB error fetching pull requests for user %s: %v", q.User.ID, err)
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
			if err := db.Table("repositories").Select("id, name_with_owner").Where("id IN ?", ids).Scan(&repos).Error; err != nil {
				log.Printf("[Contributor Handler] DB error fetching repositories for user %s: %v", q.User.ID, err)
			}
			for _, r := range repos {
				repoNames[r.ID] = r.NameWithOwner
			}
		}

		resp = githubUserResponse{
			ID:                q.User.ID,
			Login:             q.User.Login,
			AvatarUrl:         q.User.AvatarUrl,
			URL:               q.User.URL,
			Name:              q.User.Name,
			Bio:               q.User.Bio,
			Location:          q.User.Location,
			JoinDate:          q.User.CreatedAt.String(),
			WebsiteUrl:        q.User.WebsiteUrl,
			TwitterUsername:   q.User.TwitterUsername,
			TotalStars:        q.User.StarredRepositories.TotalCount,
			TotalRepos:        q.User.Repositories.TotalCount,
			Followers:         q.User.Followers.TotalCount,
			Following:         q.User.Following.TotalCount,
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
				var out []topRepository
				for _, n := range q.User.Repositories.Nodes {
					out = append(out, topRepository{
						NameWithOwner:  n.NameWithOwner,
						Description:    n.Description,
						URL:            n.URL,
						StargazerCount: n.StargazerCount,
						PrimaryLanguage: func() string {
							if n.PrimaryLanguage != nil {
								return n.PrimaryLanguage.Name
							}
							return ""
						}(),
					})
				}
				return out
			}(),
			Wallet:     dbUser.Wallet,
			GnoBalance: "0",
		}

		userCache.Set(login, cachedUser{Data: resp, Timestamp: time.Now()}, 1)
		userCache.Wait()

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("[Contributor Handler] Error encoding response for user %s: %v", login, err)
		} else {
			log.Printf("[Contributor Handler] Response sent for user: %s", login)
		}
	}
}
