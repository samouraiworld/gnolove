package sync

import (
	"context"
	"os"
	"time"

	"github.com/lib/pq"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/shurcooL/githubv4"
	"go.uber.org/zap"
	"golang.org/x/oauth2"

	"gorm.io/gorm"
)

type Syncer struct {
	db     *gorm.DB
	client *githubv4.Client
	owner  string
	repo   string
	logger *zap.SugaredLogger
}

func NewSyncer(db *gorm.DB, graphqlEndpoint, repository, owner string, logger *zap.SugaredLogger) *Syncer {
	src := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: os.Getenv("GITHUB_TOKEN")},
	)
	httpClient := oauth2.NewClient(context.Background(), src)

	client := githubv4.NewClient(httpClient)
	return &Syncer{
		db:     db,
		client: client,
		owner:  owner,
		repo:   repository,
		logger: logger,
	}
}

func getLastUpdatedPR(db gorm.DB) time.Time {
	var lastPR models.PullRequest
	db.Model(&lastPR).Order("updated_at desc").First(&lastPR)
	return lastPR.UpdatedAt
}

func getLastUpdatedIssue(db gorm.DB) time.Time {
	var lastIssue models.Issue
	db.Model(&lastIssue).Order("updated_at desc").First(&lastIssue)
	return lastIssue.UpdatedAt
}

func (s *Syncer) StartSynchonizing() {
	go func() {
		for {
			s.logger.Info("Starting synchronization...")
			err := s.syncUsers()
			if err != nil {
				s.logger.Errorf("error while syncing users %s", err.Error())
			}

			err = s.syncIssues()
			if err != nil {
				s.logger.Errorf("error while syncing issues %s", err.Error())
			}

			err = s.syncPRs()
			if err != nil {
				s.logger.Errorf("error while syncing PRs %s", err.Error())
			}

			s.logger.Info("synchronization Finished...")
			<-time.Tick(time.Minute * 3)
		}
	}()

}
func (s *Syncer) syncPRs() error {
	lastUpdatedTime := getLastUpdatedPR(*s.db)

	var q struct {
		Repository struct {
			PullRequests struct {
				Nodes    []pullRequest
				PageInfo struct {
					EndCursor   githubv4.String
					HasNextPage bool
				}
			} `graphql:"pullRequests(first: 100 after:$cursor orderBy: { field: UPDATED_AT, direction: DESC } )"`
		} `graphql:"repository(owner: \"gnolang\", name: \"gno\")"`
	}

	hasNextPage := true
	variables := map[string]interface{}{
		"cursor": (*githubv4.String)(nil), // Null after argument to get first page.
	}

	for hasNextPage {
		err := s.client.Query(context.Background(), &q, variables)
		if err != nil {
			return err
		}

		for _, pr := range q.Repository.PullRequests.Nodes {
			if lastUpdatedTime.After(pr.UpdatedAt) {
				s.logger.Info("PULL REQUESTS: All updated...")
				return nil
			}

			reviews := make([]models.Review, len(pr.Reviews.Nodes))

			for index, review := range pr.Reviews.Nodes {
				reviews[index] = models.Review{
					AuthorID:      review.Author.User.ID,
					ID:            review.ID,
					CreatedAt:     review.CreatedAt,
					PullRequestID: pr.ID,
				}
			}

			pr := models.PullRequest{
				CreatedAt: pr.CreatedAt,
				UpdatedAt: pr.UpdatedAt,
				ID:        pr.ID,
				Number:    pr.Number,
				State:     pr.State,
				Title:     pr.Title,
				AuthorID:  pr.Author.User.ID,
				Reviews:   reviews,
			}
			err = s.db.Save(pr).Error
			if err != nil {
				return err
			}

			hasNextPage = q.Repository.PullRequests.PageInfo.HasNextPage
			variables["cursor"] = githubv4.NewString(q.Repository.PullRequests.PageInfo.EndCursor)
		}
	}

	return nil
}

func (s *Syncer) syncUsers() error {
	var q struct {
		Repository struct {
			Users struct {
				Nodes []models.User
			} `graphql:"mentionableUsers(first: 100)"`
		} `graphql:"repository(owner: \"gnolang\", name: \"gno\")"`
	}

	err := s.client.Query(context.Background(), &q, nil)
	if err != nil {
		return err
	}

	for _, user := range q.Repository.Users.Nodes {
		err = s.db.Save(user).Error
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *Syncer) syncIssues() error {
	lastUpdatedTime := getLastUpdatedIssue(*s.db)

	var q struct {
		Repository struct {
			Issues struct {
				Nodes    []issue
				PageInfo struct {
					EndCursor   githubv4.String
					HasNextPage bool
				}
			} `graphql:"issues(first: 100 after:$cursor orderBy: { field: UPDATED_AT, direction: DESC } )"`
		} `graphql:"repository(owner: \"gnolang\", name: \"gno\")"`
	}

	hasNextPage := true
	variables := map[string]interface{}{
		"cursor": (*githubv4.String)(nil), // Null after argument to get first page.
	}
	for hasNextPage {

		err := s.client.Query(context.Background(), &q, variables)
		if err != nil {
			return err
		}

		for _, issue := range q.Repository.Issues.Nodes {
			labels := make(pq.StringArray, len(issue.Labels.Nodes))
			for index, label := range issue.Labels.Nodes {
				labels[index] = label.Name
			}
			if lastUpdatedTime.After(issue.UpdatedAt) {
				s.logger.Info("ISSUES: All updated...")
				return nil
			}
			issue := models.Issue{
				CreatedAt: issue.CreatedAt,
				UpdatedAt: issue.UpdatedAt,
				ID:        issue.ID,
				Number:    issue.Number,
				State:     issue.State,
				Title:     issue.Title,
				AuthorID:  issue.Author.User.ID,
				Labels:    labels,
			}
			err = s.db.Save(issue).Error
			if err != nil {
				return err
			}
		}

		hasNextPage = q.Repository.Issues.PageInfo.HasNextPage
		variables["cursor"] = githubv4.NewString(q.Repository.Issues.PageInfo.EndCursor)
	}

	return nil
}

type issue struct {
	CreatedAt time.Time
	UpdatedAt time.Time
	ID        string
	Number    int
	State     string
	Title     string
	Author    Author
	Labels    struct {
		Nodes []struct {
			Name  string
			Color string
		}
	} `graphql:"labels(first: 10)"`
}
type Author struct {
	Login string
	User  struct {
		ID string
	} `graphql:"... on User"`
}

type pullRequest struct {
	CreatedAt time.Time
	UpdatedAt time.Time
	ID        string
	Number    int
	State     string
	Title     string
	Author    Author
	Reviews   struct {
		Nodes []review
	} `graphql:"reviews(first: 100)"`
}
type review struct {
	Author    Author
	ID        string
	CreatedAt time.Time
}
