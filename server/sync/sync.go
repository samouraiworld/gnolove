package sync

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/shurcooL/githubv4"
	"go.uber.org/zap"
	"golang.org/x/oauth2"

	"gorm.io/gorm"
)

type Syncer struct {
	db           *gorm.DB
	client       *githubv4.Client
	repositories []models.Repository
	logger       *zap.SugaredLogger
}

func NewSyncer(db *gorm.DB, repositories []models.Repository, logger *zap.SugaredLogger) *Syncer {
	src := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: os.Getenv("GITHUB_API_TOKEN")},
	)
	httpClient := oauth2.NewClient(context.Background(), src)
	client := githubv4.NewClient(httpClient)
	return &Syncer{
		db:           db,
		client:       client,
		repositories: repositories,
		logger:       logger,
	}
}

func getLastUpdatedPR(db gorm.DB, repositoryID string) time.Time {
	var lastPR models.PullRequest
	db.Model(&lastPR).Where("repository_id = ?", repositoryID).Order("updated_at desc").First(&lastPR)
	return lastPR.UpdatedAt
}

func getLastUpdatedIssue(db gorm.DB, repositoryID string) time.Time {
	var lastIssue models.Issue
	db.Model(&lastIssue).Where("repository_id = ?", repositoryID).Order("updated_at desc").First(&lastIssue)
	return lastIssue.UpdatedAt
}

func getLastUpdatedMilestone(db gorm.DB, repositoryID string) time.Time {
	var lastMilestone models.Milestone
	db.Model(&lastMilestone).Where("repository_id = ?", repositoryID).Order("updated_at desc").First(&lastMilestone)
	return lastMilestone.UpdatedAt
}

func (s *Syncer) StartSynchonizing() error {
	for _, repository := range s.repositories {
		err := s.db.Save(&repository).Error
		if err != nil {
			return err
		}
	}
	go func() {
		for {
			for _, repository := range s.repositories {
				fmt.Printf("repository: %#v", repository)
				s.logger.Info("Starting synchronization for ", repository.ID)
				err := s.syncUsers(repository)
				if err != nil {
					s.logger.Errorf("error while syncing users %s", err.Error())
				}

				err = s.syncIssues(repository)
				if err != nil {
					s.logger.Errorf("error while syncing issues %s", err.Error())
				}

				err = s.syncPRs(repository)
				if err != nil {
					s.logger.Errorf("error while syncing PRs %s", err.Error())
				}

				err = s.syncMilestones(repository)
				if err != nil {
					s.logger.Errorf("error while syncing Milestones %s", err.Error())
				}

				err = s.syncCommits(repository)
				if err != nil {
					s.logger.Errorf("error while syncing Milestones %s", err.Error())
				}
			}
			s.logger.Info("synchronization Finished...")
			<-time.Tick(time.Minute * 3)
		}
	}()

	return nil
}
func (s *Syncer) syncPRs(repository models.Repository) error {
	lastUpdatedTime := getLastUpdatedPR(*s.db, repository.ID)

	var q struct {
		Repository struct {
			PullRequests struct {
				Nodes    []pullRequest
				PageInfo struct {
					EndCursor   githubv4.String
					HasNextPage bool
				}
			} `graphql:"pullRequests(first: 100 after:$cursor orderBy: { field: UPDATED_AT, direction: DESC } )"`
		} `graphql:"repository(owner: $owner, name: $name)"`
	}

	hasNextPage := true
	variables := map[string]interface{}{
		"cursor": (*githubv4.String)(nil), // Null after argument to get first page.
		"owner":  githubv4.String(repository.Owner),
		"name":   githubv4.String(repository.Name),
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
					RepositoryID:  repository.ID,
					ID:            review.ID,
					CreatedAt:     review.CreatedAt,
					PullRequestID: pr.ID,
				}
			}

			pr := models.PullRequest{
				CreatedAt:    pr.CreatedAt,
				UpdatedAt:    pr.UpdatedAt,
				RepositoryID: repository.ID,
				ID:           pr.ID,
				Number:       pr.Number,
				State:        pr.State,
				Title:        pr.Title,
				AuthorID:     pr.Author.User.ID,
				Reviews:      reviews,
				MilestoneID:  pr.Milestone.ID,
				URL:          pr.Url,
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

func (s *Syncer) syncUsers(repository models.Repository) error {
	variables := map[string]interface{}{
		"cursor": (*githubv4.String)(nil), // Null after argument to get first page.
		"owner":  githubv4.String(repository.Owner),
		"name":   githubv4.String(repository.Name),
	}

	hasNextPage := true

	for hasNextPage {

		var q struct {
			Repository struct {
				Users struct {
					Nodes    []user
					PageInfo struct {
						EndCursor   githubv4.String
						HasNextPage bool
					}
				} `graphql:"mentionableUsers(first: 100 after:$cursor )"`
			} `graphql:"repository(owner: $owner, name: $name)"`
		}

		err := s.client.Query(context.Background(), &q, variables)
		if err != nil {
			return err
		}

		for _, user := range q.Repository.Users.Nodes {
			err = s.db.Save(&models.User{
				ID:        user.ID,
				Login:     user.Login,
				AvatarUrl: user.AvatarUrl,
				URL:       user.URL,
				Name:      user.Name,
			}).Error
			if err != nil {
				return fmt.Errorf("error save %s", err.Error())
			}
		}

		hasNextPage = q.Repository.Users.PageInfo.HasNextPage
		variables["cursor"] = githubv4.NewString(q.Repository.Users.PageInfo.EndCursor)
	}

	return nil
}

func (s *Syncer) syncIssues(repository models.Repository) error {
	lastUpdatedTime := getLastUpdatedIssue(*s.db, repository.ID)

	var q struct {
		Repository struct {
			Issues struct {
				Nodes    []issue
				PageInfo struct {
					EndCursor   githubv4.String
					HasNextPage bool
				}
			} `graphql:"issues(first: 100 after:$cursor orderBy: { field: UPDATED_AT, direction: DESC } )"`
		} `graphql:"repository(owner: $owner, name: $name)"`
	}

	hasNextPage := true
	variables := map[string]interface{}{
		"cursor": (*githubv4.String)(nil), // Null after argument to get first page.
		"owner":  githubv4.String(repository.Owner),
		"name":   githubv4.String(repository.Name),
	}
	for hasNextPage {

		err := s.client.Query(context.Background(), &q, variables)
		if err != nil {
			return err
		}

		for _, issue := range q.Repository.Issues.Nodes {
			labels := make([]models.Label, len(issue.Labels.Nodes))
			for index, label := range issue.Labels.Nodes {
				labels[index] = models.Label{
					Name:  label.Name,
					Color: label.Color,
				}
			}

			assignesMap := map[string]bool{}
			assignees := make([]models.Assignee, 0, len(issue.Assignees.Nodes))
			for _, assignee := range issue.Assignees.Nodes {
				if assignesMap[assignee.User.ID] {
					continue
				}
				assignees = append(assignees, models.Assignee{
					UserID:  assignee.User.ID,
					IssueID: issue.ID,
				})

				assignesMap[assignee.User.ID] = true
			}

			if lastUpdatedTime.After(issue.UpdatedAt) {
				s.logger.Info("ISSUES: All updated...")
				return nil
			}
			issue := models.Issue{
				CreatedAt:    issue.CreatedAt,
				UpdatedAt:    issue.UpdatedAt,
				ID:           issue.ID,
				RepositoryID: repository.ID,
				Number:       issue.Number,
				State:        issue.State,
				Title:        issue.Title,
				AuthorID:     issue.Author.User.ID,
				Labels:       labels,
				MilestoneID:  issue.Milestone.ID,
				URL:          issue.Url,
				Assignees:    assignees,
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

func (s *Syncer) syncMilestones(repository models.Repository) error {
	lastUpdatedTime := getLastUpdatedMilestone(*s.db, repository.ID)

	var q struct {
		Repository struct {
			Milestones struct {
				Nodes    []milestone
				PageInfo struct {
					EndCursor   githubv4.String
					HasNextPage bool
				}
			} `graphql:"milestones(first: 100 after:$cursor orderBy: { field: UPDATED_AT, direction: DESC } )"`
		} `graphql:"repository(owner: $owner, name: $name)"`
	}

	hasNextPage := true
	variables := map[string]interface{}{
		"cursor": (*githubv4.String)(nil), // Null after argument to get first page.
		"owner":  githubv4.String(repository.Owner),
		"name":   githubv4.String(repository.Name),
	}
	for hasNextPage {

		err := s.client.Query(context.Background(), &q, variables)
		if err != nil {
			return err
		}

		for _, milestone := range q.Repository.Milestones.Nodes {

			if lastUpdatedTime.After(milestone.UpdatedAt) {
				s.logger.Info("Milestones: All updated...")
				return nil
			}
			issue := models.Milestone{
				CreatedAt:    milestone.CreatedAt,
				UpdatedAt:    milestone.UpdatedAt,
				RepositoryID: repository.ID,
				ID:           milestone.ID,
				Number:       milestone.Number,
				State:        milestone.State,
				Title:        milestone.Title,
				AuthorID:     milestone.Creator.User.ID,
				Description:  milestone.Description,
				Url:          milestone.Url,
			}
			err = s.db.Save(issue).Error
			if err != nil {
				return err
			}
		}

		hasNextPage = q.Repository.Milestones.PageInfo.HasNextPage
		variables["cursor"] = githubv4.NewString(q.Repository.Milestones.PageInfo.EndCursor)
	}

	return nil
}
func (s *Syncer) syncCommits(repository models.Repository) error {

	var q struct {
		Repository struct {
			Ref struct {
				Target struct {
					Commit struct {
						History struct {
							Nodes    []Commit
							PageInfo struct {
								EndCursor   githubv4.String
								HasNextPage bool
							}
						} `graphql:"history(first: 100 after:$cursor)"`
					} `graphql:"... on Commit"`
				}
			} `graphql:"ref(qualifiedName: $branch)"`
		} `graphql:"repository(owner: $owner, name: $name)"`
	}

	hasNextPage := true
	variables := map[string]interface{}{
		"cursor": (*githubv4.String)(nil), // Null after argument to get first page.
		"owner":  githubv4.String(repository.Owner),
		"name":   githubv4.String(repository.Name),
		"branch": githubv4.String(repository.BaseBranch),
	}
	for hasNextPage {

		err := s.client.Query(context.Background(), &q, variables)
		if err != nil {
			return err
		}

		for _, c := range q.Repository.Ref.Target.Commit.History.Nodes {
			commit := models.Commit{
				ID:           c.ID,
				RepositoryID: repository.ID,
				AuthorID:     c.Author.User.ID,
				URL:          c.Url,
				CreatedAt:    c.CommittedDate,
				UpdatedAt:    c.CommittedDate,
			}
			err = s.db.Save(commit).Error
			if err != nil {
				return err
			}
		}

		hasNextPage = q.Repository.Ref.Target.Commit.History.PageInfo.HasNextPage
		variables["cursor"] = githubv4.NewString(q.Repository.Ref.Target.Commit.History.PageInfo.EndCursor)
	}

	return nil
}

type milestone struct {
	ID          string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Number      int
	Title       string
	State       string
	Description string
	Url         string
	Creator     Author
}

type issue struct {
	CreatedAt time.Time
	UpdatedAt time.Time
	ID        string
	Number    int
	State     string
	Title     string
	Author    Author
	Assignees struct {
		Nodes []Author
	} `graphql:"assignees(first: 10)"`
	Url       string
	Milestone milestone
	Labels    struct {
		Nodes []struct {
			Name  string
			Color string
		}
	} `graphql:"labels(first: 10)"`
}
type Author struct {
	User struct {
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
	Url       string
	Author    Author
	Milestone milestone
	Reviews   struct {
		Nodes []review
	} `graphql:"reviews(first: 100)"`
}
type review struct {
	Author    Author
	ID        string
	CreatedAt time.Time
}

type Commit struct {
	Author struct {
		User struct {
			ID   string
			Name string
		}
	}
	ID            string
	Url           string
	CommittedDate time.Time
}

type user struct {
	ID        string `gorm:"primarykey"`
	Login     string
	AvatarUrl string
	URL       string
	Name      string
}
