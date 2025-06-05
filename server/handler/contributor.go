package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/shurcooL/githubv4"
	"golang.org/x/oauth2"
	"gorm.io/gorm"

	"github.com/samouraiworld/topofgnomes/server/onchain"
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

type topRepository struct {
	NameWithOwner   string `json:"nameWithOwner"`
	Description     string `json:"description"`
	URL             string `json:"url"`
	StargazerCount  int    `json:"stargazerCount"`
	PrimaryLanguage string `json:"primaryLanguage"`
}

type recentActivity struct {
	Title      string `json:"title"`
	URL        string `json:"url"`
	CreatedAt  string `json:"createdAt"`
	Repository string `json:"repository"`
	Type       string `json:"type"`
}

type cachedUser struct {
	Data      githubUserResponse
	Timestamp time.Time
}

var (
	userCache   = make(map[string]cachedUser)
	cacheMutex  sync.Mutex
	cacheExpiry = 10 * time.Minute
)

func HandleGetContributor(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var err error
		var resp githubUserResponse
		log.Printf("[Contributor Handler] Request for: %s", r.URL.Path)
		login := chi.URLParam(r, "login")
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
		cacheMutex.Lock()
		if cached, ok := userCache[login]; ok && time.Since(cached.Timestamp) < cacheExpiry {
			log.Printf("[Contributor Handler] Cache hit for user: %s", login)
			cacheMutex.Unlock()
			json.NewEncoder(w).Encode(cached.Data)
			return
		}
		cacheMutex.Unlock()
		log.Printf("[Contributor Handler] Cache miss for user: %s. Querying GitHub API...", login)

		// Prepare GitHub client
		src := oauth2.StaticTokenSource(
			&oauth2.Token{AccessToken: os.Getenv("GITHUB_API_TOKEN")},
		)
		httpClient := oauth2.NewClient(context.Background(), src)
		client := githubv4.NewClient(httpClient)

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
				ContributionsCollection struct {
					TotalCommitContributions      int
					TotalPullRequestContributions int
					TotalIssueContributions       int
				} `graphql:"contributionsCollection"`
				Issues struct {
					Nodes []struct {
						Title      string
						URL        string
						CreatedAt  githubv4.DateTime
						Repository struct {
							NameWithOwner string
						}
					}
				} `graphql:"issues(first: 3, orderBy: {field: CREATED_AT, direction: DESC})"`
				PullRequests struct {
					Nodes []struct {
						Title      string
						URL        string
						CreatedAt  githubv4.DateTime
						Repository struct {
							NameWithOwner string
						}
					}
				} `graphql:"pullRequests(first: 3, orderBy: {field: CREATED_AT, direction: DESC})"`
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

		// Fetch GNO balance from onchain package
		gnoBalance, err := onchain.GetGnoBalance(r.Context(), dbUser.Wallet)
		if err != nil {
			log.Printf("[OnChain] Failed to fetch GNO balance for wallet %s: %v", dbUser.Wallet, err)
			gnoBalance = "0"
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
			TotalCommits:      q.User.ContributionsCollection.TotalCommitContributions,
			TotalPullRequests: q.User.ContributionsCollection.TotalPullRequestContributions,
			TotalIssues:       q.User.ContributionsCollection.TotalIssueContributions,
			Wallet:            dbUser.Wallet,
			GnoBalance:        gnoBalance,
			RecentIssues: func() []recentActivity {
				var out []recentActivity
				for _, n := range q.User.Issues.Nodes {
					out = append(out, recentActivity{
						Title:      n.Title,
						URL:        n.URL,
						CreatedAt:  n.CreatedAt.String(),
						Repository: n.Repository.NameWithOwner,
						Type:       "issue",
					})
				}
				return out
			}(),
			RecentPullRequests: func() []recentActivity {
				var out []recentActivity
				for _, n := range q.User.PullRequests.Nodes {
					out = append(out, recentActivity{
						Title:      n.Title,
						URL:        n.URL,
						CreatedAt:  n.CreatedAt.String(),
						Repository: n.Repository.NameWithOwner,
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
		}

		cacheMutex.Lock()
		userCache[login] = cachedUser{Data: resp, Timestamp: time.Now()}
		cacheMutex.Unlock()

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("[Contributor Handler] Error encoding response for user %s: %v", login, err)
		} else {
			log.Printf("[Contributor Handler] Response sent for user: %s", login)
		}
	}
}
