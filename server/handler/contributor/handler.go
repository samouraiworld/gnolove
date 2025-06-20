package contributor

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgraph-io/ristretto"
	"gorm.io/gorm"
)

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
		log.Printf("[Contributor Handler] Request for: %s", r.URL.Path)
		login := strings.TrimPrefix(r.URL.Path, "/contributors/")
		log.Printf("[Contributor Handler] Extracted login from URL.Path: '%s'", login)
		if login == "" {
			http.Error(w, "Missing user login", http.StatusBadRequest)
			return
		}

		// Check if cache should be disabled
		disableCache := os.Getenv("DISABLE_CACHE") == "true" || userCache == nil
		if !disableCache {
			if val, found := userCache.Get(login); found {
				if cached, ok := val.(cachedUser); ok && time.Since(cached.Timestamp) < cacheExpiry {
					w.Header().Set("Content-Type", "application/json")
					if err := json.NewEncoder(w).Encode(cached.Data); err != nil {
						log.Printf("[Contributor Handler] Error encoding cached response for user %s: %v", login, err)
					} else {
						log.Printf("[Contributor Handler] Response sent from cache for user: %s", login)
					}
					return
				}
			}
		}

		// Call the actual handler logic
		resp, err := HandleGetContributorLogic(db, login)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if !disableCache {
			userCache.Set(login, cachedUser{Data: resp, Timestamp: time.Now()}, 1)
			userCache.Wait()
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("[Contributor Handler] Error encoding response for user %s: %v", login, err)
		} else {
			log.Printf("[Contributor Handler] Response sent for user: %s", login)
		}
	}
}

func HandleGetContributorLogic(db *gorm.DB, login string) (githubUserResponse, error) {
	dbData, dbUser, err := GetContributorDataFromDatabase(db, login)
	if err != nil {
		if err.Error() == "User not found" {
			return githubUserResponse{}, err
		} else {
			return githubUserResponse{}, err
		}
	}

	ghData, err := GetContributorDataFromGithub(login)
	if err != nil {
		return githubUserResponse{}, err
	}

	onChainData, err := GetContributorOnChainData(dbUser.Wallet)
	if err != nil {
		log.Printf("failed to get on-chain data for wallet %s: %v", dbUser.Wallet, err)
	}

	resp := githubUserResponse{
		ContributionsPerDay:        dbData.ContributionsPerDay,
		ID:                         ghData.ID,
		Login:                      ghData.Login,
		AvatarUrl:                  ghData.AvatarUrl,
		URL:                        ghData.URL,
		Name:                       ghData.Name,
		Bio:                        ghData.Bio,
		Location:                   ghData.Location,
		JoinDate:                   ghData.JoinDate,
		WebsiteUrl:                 ghData.WebsiteUrl,
		TwitterUsername:            ghData.TwitterUsername,
		TotalStars:                 ghData.TotalStars,
		TotalRepos:                 ghData.TotalRepos,
		Followers:                  ghData.Followers,
		Following:                  ghData.Following,
		TotalCommits:               dbData.TotalCommits,
		TotalPullRequests:          dbData.TotalPullRequests,
		TotalIssues:                dbData.TotalIssues,
		RecentIssues:               dbData.RecentIssues,
		RecentPullRequests:         dbData.RecentPullRequests,
		TopRepositories:            ghData.TopRepositories,
		Wallet:                     dbUser.Wallet,
		GnoBalance:                 onChainData.GnoBalance,
		CommitsPerMonth:            dbData.CommitsPerMonth,
		PullRequestsPerMonth:       dbData.PullRequestsPerMonth,
		IssuesPerMonth:             dbData.IssuesPerMonth,
		TopContributedRepositories: dbData.TopContributedRepositories,
	}
	if resp.TopContributedRepositories == nil {
		resp.TopContributedRepositories = []repoInfoWithContributions{}
	}
	return resp, nil
}
