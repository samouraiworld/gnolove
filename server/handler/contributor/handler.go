package contributor

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

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

		contributorData, _ := GetContributorOnChainData(dbUser.Wallet, dbUser.Name)

		resp := githubUserResponse{
			ID:                         dbUser.ID,
			Login:                      dbUser.Login,
			AvatarUrl:                  dbUser.AvatarUrl,
			URL:                        dbUser.URL,
			Name:                       dbUser.Name,
			Bio:                        dbUser.Bio,
			Location:                   dbUser.Location,
			JoinDate:                   dbUser.JoinDate.Format(time.RFC3339),
			WebsiteUrl:                 dbUser.WebsiteUrl,
			TwitterUsername:            dbUser.TwitterUsername,
			TotalStars:                 dbUser.TotalStars,
			TotalRepos:                 dbUser.TotalRepos,
			Followers:                  dbUser.Followers,
			Following:                  dbUser.Following,
			TotalCommits:               dbData.TotalCommits,
			TotalPullRequests:          dbData.TotalPullRequests,
			TotalIssues:                dbData.TotalIssues,
			RecentIssues:               dbData.RecentIssues,
			RecentPullRequests:         dbData.RecentPullRequests,
			TopRepositories:            getTopRepositories(db, dbUser.Login),
			Wallet:                     dbUser.Wallet,
			GnoBalance:                 contributorData.GnoBalance,
			RenderOutput:               contributorData.RenderOutput,
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
