package contributor

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"gorm.io/gorm"
)

func HandleGetContributor(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[Contributor Handler] Request for: %s", r.URL.Path)
		login := strings.TrimPrefix(r.URL.Path, "/contributors/")
		log.Printf("[Contributor Handler] Extracted login from URL.Path: '%s'", login)
		if login == "" {
			http.Error(w, "Missing user login", http.StatusBadRequest)
			return
		}

		dbData, dbUser, err := GetContributorDataFromDatabase(db, login)
		if err != nil {
			if err.Error() == "user not found" {
				http.Error(w, "User not found", http.StatusNotFound)
				return
			}
			log.Printf("[Contributor Handler] DB error for login %s: %v", login, err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		gnoBalance := "0"
		if dbUser.Wallet != "" {
			balanceStruct, _ := GetContributorOnChainData(dbUser.Wallet)
			gnoBalance = balanceStruct.GnoBalance
		}

		resp := githubUserResponse{
			ID:                         dbUser.ID,
			Login:                      dbUser.Login,
			AvatarUrl:                  dbUser.AvatarUrl,
			URL:                        dbUser.URL,
			Name:                       dbUser.Name,
			Bio:                        "", // not in dbUser
			Location:                   "", // not in dbUser
			JoinDate:                   "", // not in dbUser
			WebsiteUrl:                 "", // not in dbUser
			TwitterUsername:            "", // not in dbUser
			TotalStars:                 0,  // not in dbUser
			TotalRepos:                 0,  // not in dbUser
			Followers:                  0,  // not in dbUser
			Following:                  0,  // not in dbUser
			TotalCommits:               dbData.TotalCommits,
			TotalPullRequests:          dbData.TotalPullRequests,
			TotalIssues:                dbData.TotalIssues,
			RecentIssues:               dbData.RecentIssues,
			RecentPullRequests:         dbData.RecentPullRequests,
			TopRepositories:            []repoInfo{}, // not available from DB, return empty array
			Wallet:                     dbUser.Wallet,
			GnoBalance:                 gnoBalance,
			ContributionsPerDay:        dbData.ContributionsPerDay,
			CommitsPerMonth:            dbData.CommitsPerMonth,
			PullRequestsPerMonth:       dbData.PullRequestsPerMonth,
			IssuesPerMonth:             dbData.IssuesPerMonth,
			TopContributedRepositories: dbData.TopContributedRepositories,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("[Contributor Handler] Error encoding response for user %s: %v", login, err)
		} else {
			log.Printf("[Contributor Handler] Response sent for user: %s", login)
		}
	}
}
