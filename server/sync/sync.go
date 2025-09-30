package sync

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/Khan/genqlient/graphql"
	"github.com/robfig/cron/v3"
	"github.com/samouraiworld/topofgnomes/server/handler/ai"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/shurcooL/githubv4"
	"go.uber.org/zap"
	"golang.org/x/oauth2"

	rpcclient "github.com/gnolang/gno/tm2/pkg/bft/rpc/client"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Syncer struct {
	db            *gorm.DB
	client        *githubv4.Client
	repositories  []models.Repository
	logger        *zap.SugaredLogger
	graphqlClient graphql.Client
	rpcClient     *rpcclient.RPCClient
}

func NewSyncer(db *gorm.DB, repositories []models.Repository, logger *zap.SugaredLogger) *Syncer {
	src := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: os.Getenv("GITHUB_API_TOKEN")},
	)
	httpClient := oauth2.NewClient(context.Background(), src)
	client := githubv4.NewClient(httpClient)
	gqlClient := graphql.NewClient(os.Getenv("GNO_GRAPHQL_ENDPOINT"), nil)
	rpcClient, err := rpcclient.NewHTTPClient(os.Getenv("GNO_RPC_ENDPOINT"))
	if err != nil {
		panic(err)
	}

	return &Syncer{
		db:            db,
		client:        client,
		repositories:  repositories,
		logger:        logger,
		graphqlClient: gqlClient,
		rpcClient:     rpcClient,
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
					s.logger.Errorf("error while syncing commits %s", err.Error())
				}
			}

			// For some reason github api doesn't return all users. so we have to sync them manually
			// by taking the ids from pull requests and issues without a corresponding ID on users table
			err := s.syncRemaningUsers()
			if err != nil {
				s.logger.Errorf("error while syncing Remaning Users %s", err.Error())
			}

			// After syncing everything else, update user details.
			err = s.syncUserDetails()
			if err != nil {
				s.logger.Errorf("error while syncing user details %s", err.Error())
			}

			err = s.syncGnoUserRegistrations(context.Background())
			if err != nil {
				s.logger.Errorf("error while syncing gno user registrations %s", err.Error())
			}

			err = s.syncPublishedPackages(context.Background())
			if err != nil {
				s.logger.Errorf("error while syncing gno published packages %s", err.Error())
			}

			err = s.syncProposals(context.Background())
			if err != nil {
				s.logger.Errorf("error while syncing proposals %s", err.Error())
			}

			err = s.syncVotesOnProposals(context.Background())
			if err != nil {
				s.logger.Errorf("error while syncing votes on proposals %s", err.Error())
			}

			err = s.syncGovDaoMembers()
			if err != nil {
				s.logger.Errorf("error while syncing GovDao members %s", err.Error())
			}

			s.logger.Info("Syncing finished.")

			<-time.Tick(2 * time.Hour)
		}
	}()

	if os.Getenv("MISTRAL_API_KEY") != "" {
		c := cron.New()

		// Schedule the task to run every Sunday at 23:59
		_, err := c.AddFunc("59 23 * * 0", func() {
			s.logger.Info("Starting report synchronization.")
			err := s.syncReports()
			if err != nil {
				s.logger.Errorf("error while syncing reports %s", err.Error())
			}
		})

		if err != nil {
			s.logger.Errorf("Failed to schedule report synchronization: %v", err)
		}

		c.Start()
	} else {
		s.logger.Warn("MISTRAL_API_KEY is not set. Report synchronization will not start.")
	}

	return nil
}

func (s *Syncer) syncReports() error {
	report, err := ai.GenerateReport(s.db)
	if err != nil {
		s.logger.Errorf("Failed to generate report: %v", err)
		return err
	}

	s.logger.Infof("Report generated successfully: %s", report.ID)
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

			if pr.Author.Typename == "Bot" {
				// avoid syncing PRs from bot users
				continue
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
				CreatedAt:        pr.CreatedAt,
				UpdatedAt:        pr.UpdatedAt,
				RepositoryID:     repository.ID,
				ID:               pr.ID,
				Number:           pr.Number,
				State:            pr.State,
				Title:            pr.Title,
				AuthorID:         pr.Author.User.ID,
				Reviews:          reviews,
				MilestoneID:      pr.Milestone.ID,
				URL:              pr.Url,
				ReviewDecision:   pr.ReviewDecision,
				Mergeable:        pr.Mergeable,
				MergeStateStatus: pr.MergeStateStatus,
				MergedAt:         pr.MergedAt,
				IsDraft:          pr.IsDraft,
			}
			err = s.db.Save(pr).Error
			if err != nil {
				return err
			}

		}
		hasNextPage = q.Repository.PullRequests.PageInfo.HasNextPage
		variables["cursor"] = githubv4.NewString(q.Repository.PullRequests.PageInfo.EndCursor)
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
			// Upsert user record
			err = s.db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "id"}},                                                         // conflict target
				DoUpdates: clause.AssignmentColumns([]string{"login", "avatar_url", "url", "name", "join_date"}), // update join_date too
			}).Create(&models.User{
				ID:        user.ID,
				Login:     user.Login,
				AvatarUrl: user.AvatarUrl,
				URL:       user.URL,
				Name:      user.Name,
				JoinDate:  user.CreatedAt.Time,
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
				Title:        c.MessageHeadline,
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

// syncUserDetails fetches and updates detailed GitHub data for all users
func (s *Syncer) syncUserDetails() error {
	var users []models.User
	if err := s.db.Find(&users).Error; err != nil {
		s.logger.Errorf("Failed to fetch users for details sync: %v", err)
		return err
	}

	for _, user := range users {
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
				}
			} `graphql:"user(login: $login)"`
		}
		variables := map[string]interface{}{
			"login": githubv4.String(user.Login),
		}
		err := s.client.Query(context.Background(), &q, variables)
		if err != nil {
			s.logger.Errorf("Failed to fetch details for user %s: %v", user.Login, err)
			continue
		}

		// Update user fields
		user.Bio = q.User.Bio
		user.Location = q.User.Location
		user.JoinDate = q.User.CreatedAt.Time
		user.WebsiteUrl = q.User.WebsiteUrl
		user.TwitterUsername = q.User.TwitterUsername
		user.TotalStars = q.User.StarredRepositories.TotalCount
		user.TotalRepos = q.User.Repositories.TotalCount
		user.Followers = q.User.Followers.TotalCount
		user.Following = q.User.Following.TotalCount

		// Fetch top repositories from GitHub API
		var repoQuery struct {
			User struct {
				Repositories struct {
					Nodes []struct {
						NameWithOwner   string `graphql:"nameWithOwner"`
						Description     string `graphql:"description"`
						Url             string `graphql:"url"`
						StargazerCount  int    `graphql:"stargazerCount"`
						PrimaryLanguage struct {
							Name string `graphql:"name"`
						} `graphql:"primaryLanguage"`
					} `graphql:"nodes"`
				} `graphql:"repositories(first: 3, privacy: PUBLIC, orderBy: { field: STARGAZERS, direction: DESC })"`
			} `graphql:"user(login: $login)"`
		}
		repoVars := map[string]interface{}{
			"login": githubv4.String(user.Login),
		}
		err = s.client.Query(context.Background(), &repoQuery, repoVars)
		if err != nil {
			s.logger.Errorf("Failed to fetch top repositories for user %s: %v", user.Login, err)
		} else {
			topRepos := make([]struct {
				NameWithOwner   string
				Description     string
				URL             string
				StargazerCount  int
				PrimaryLanguage string
			}, 0, len(repoQuery.User.Repositories.Nodes))
			for _, n := range repoQuery.User.Repositories.Nodes {
				topRepos = append(topRepos, struct {
					NameWithOwner   string
					Description     string
					URL             string
					StargazerCount  int
					PrimaryLanguage string
				}{
					NameWithOwner:   n.NameWithOwner,
					Description:     n.Description,
					URL:             n.Url,
					StargazerCount:  n.StargazerCount,
					PrimaryLanguage: n.PrimaryLanguage.Name,
				})
			}
			topReposJSON, err := json.Marshal(topRepos)
			if err != nil {
				s.logger.Errorf("Failed to marshal top repositories for user %s: %v", user.Login, err)
			} else {
				user.TopRepositories = string(topReposJSON)
			}
		}

		if err := s.db.Save(&user).Error; err != nil {
			s.logger.Errorf("Failed to update user %s: %v", user.Login, err)
		}
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
	Typename string `graphql:"__typename"`
	User     struct {
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
	ReviewDecision   string     `graphql:"reviewDecision"`
	Mergeable        string     `graphql:"mergeable"`
	MergeStateStatus string     `graphql:"mergeStateStatus"`
	MergedAt         *time.Time `graphql:"mergedAt"`
	IsDraft          bool       `graphql:"isDraft"`
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
	ID              string
	Url             string
	MessageHeadline string
	CommittedDate   time.Time
}

type user struct {
	ID        string `gorm:"primarykey"`
	Login     string
	AvatarUrl string
	URL       string
	Name      string
	CreatedAt githubv4.DateTime
}

func (s *Syncer) syncRemaningUsers() error {
	db, err := s.db.DB()
	if err != nil {
		return err
	}

	// Take all authorIds from Prs and issues whose user is not yet synced
	rows, err := db.Query(`
	select distinct * from (
		select pr.author_id from pull_requests pr 
		UNION
		select i.author_id  from issues i
	) where author_id != '' and author_id not in (select id from users)
	`)
	if err != nil {
		return err
	}

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return err
		}
		ids = append(ids, id)
	}
	rows.Close()

	var q struct {
		Node struct {
			User user `graphql:"... on User"`
		} `graphql:"node(id: $id)"`
	}

	for _, id := range ids {
		variables := map[string]interface{}{
			"id": githubv4.ID(id),
		}

		err := s.client.Query(context.Background(), &q, variables)
		if err != nil {
			return err
		}

		user := &models.User{
			ID:        q.Node.User.ID,
			Login:     q.Node.User.Login,
			AvatarUrl: q.Node.User.AvatarUrl,
			URL:       q.Node.User.URL,
			Name:      q.Node.User.Name,
			JoinDate:  q.Node.User.CreatedAt.Time,
		}

		if err := s.db.Save(user).Error; err != nil {
			s.logger.Errorf("Failed to update user %s: %v", user.Login, err)
		}
	}
	return nil
}
