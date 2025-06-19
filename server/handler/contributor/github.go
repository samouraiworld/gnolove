package contributor

import (
	"context"
	"fmt"
	"os"

	"github.com/shurcooL/githubv4"
	"golang.org/x/oauth2"
)

// GetContributorDataFromGithub gathers all GitHub API queries for the contributor
func GetContributorDataFromGithub(login string) (struct {
	ID              string
	Login           string
	AvatarUrl       string
	URL             string
	Name            string
	Bio             string
	Location        string
	JoinDate        string
	WebsiteUrl      string
	TwitterUsername string
	TotalStars      int
	TotalRepos      int
	Followers       int
	Following       int
	TopRepositories []repoInfo
}, error) {
	token := os.Getenv("GITHUB_API_TOKEN")
	if token == "" {
		return struct {
			ID              string
			Login           string
			AvatarUrl       string
			URL             string
			Name            string
			Bio             string
			Location        string
			JoinDate        string
			WebsiteUrl      string
			TwitterUsername string
			TotalStars      int
			TotalRepos      int
			Followers       int
			Following       int
			TopRepositories []repoInfo
		}{}, fmt.Errorf("GITHUB_API_TOKEN not set")
	}

	src := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	ctx := context.Background()
	httpClient := oauth2.NewClient(ctx, src)
	client := githubv4.NewClient(httpClient)

	var q struct {
		User struct {
			ID              string
			Login           string
			AvatarUrl       string `graphql:"avatarUrl"`
			URL             string
			Name            string
			Bio             string
			Location        string
			CreatedAt       githubv4.DateTime
			WebsiteUrl      string
			TwitterUsername string
			Followers       struct {
				TotalCount int
			}
			Following struct {
				TotalCount int
			}
			Repositories struct {
				TotalCount int
			} `graphql:"repositories"`
			TopRepositories struct {
				Nodes []struct {
					Name           string
					NameWithOwner  string
					StargazerCount int
					URL            string
				}
			} `graphql:"topRepositories(first: 3, orderBy: {field: STARGAZERS, direction: DESC})"`
		} `graphql:"user(login: $login)"`
	}
	vars := map[string]interface{}{
		"login": githubv4.String(login),
	}
	if err := client.Query(ctx, &q, vars); err != nil {
		return struct {
			ID              string
			Login           string
			AvatarUrl       string
			URL             string
			Name            string
			Bio             string
			Location        string
			JoinDate        string
			WebsiteUrl      string
			TwitterUsername string
			TotalStars      int
			TotalRepos      int
			Followers       int
			Following       int
			TopRepositories []repoInfo
		}{}, err
	}

	totalStars := 0
	topRepos := make([]repoInfo, 0, len(q.User.TopRepositories.Nodes))
	for _, repo := range q.User.TopRepositories.Nodes {
		totalStars += repo.StargazerCount
		topRepos = append(topRepos, repoInfo{
			NameWithOwner:  repo.NameWithOwner,
			URL:            repo.URL,
			StargazerCount: repo.StargazerCount,
			Description:    "",
		})
	}

	return struct {
		ID              string
		Login           string
		AvatarUrl       string
		URL             string
		Name            string
		Bio             string
		Location        string
		JoinDate        string
		WebsiteUrl      string
		TwitterUsername string
		TotalStars      int
		TotalRepos      int
		Followers       int
		Following       int
		TopRepositories []repoInfo
	}{
		ID:              q.User.ID,
		Login:           q.User.Login,
		AvatarUrl:       q.User.AvatarUrl,
		URL:             q.User.URL,
		Name:            q.User.Name,
		Bio:             q.User.Bio,
		Location:        q.User.Location,
		JoinDate:        q.User.CreatedAt.Format("2006-01-02"),
		WebsiteUrl:      q.User.WebsiteUrl,
		TwitterUsername: q.User.TwitterUsername,
		TotalStars:      totalStars,
		TotalRepos:      q.User.Repositories.TotalCount,
		Followers:       q.User.Followers.TotalCount,
		Following:       q.User.Following.TotalCount,
		TopRepositories: topRepos,
	}, nil
}
