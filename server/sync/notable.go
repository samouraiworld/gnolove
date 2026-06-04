package sync

import (
	"context"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/shurcooL/githubv4"
)

// gnolang "Notable PRs" board — https://github.com/orgs/gnolang/projects/66
const (
	notableProjectOwner  = "gnolang"
	notableProjectNumber = 66
)

// syncNotableBoard mirrors the gnolang "Notable PRs" GitHub Project (#66) into
// the local DB. It reads the board's PR items + their "Status" column via the
// Projects v2 GraphQL API.
//
// REQUIRES that GITHUB_API_TOKEN carries the `read:project` scope (classic PAT)
// or `Projects: Read` (fine-grained) AND can see project #66. Without it the
// query returns an authorization error; the caller logs and continues (this
// sync is best-effort and must never break the main repo sync).
func (s *Syncer) syncNotableBoard(ctx context.Context) error {
	var q struct {
		Organization struct {
			ProjectV2 struct {
				Items struct {
					Nodes []struct {
						ID               githubv4.String
						FieldValueByName struct {
							SingleSelect struct {
								Name githubv4.String
							} `graphql:"... on ProjectV2ItemFieldSingleSelectValue"`
						} `graphql:"fieldValueByName(name: \"Status\")"`
						Content struct {
							PullRequest struct {
								Number         githubv4.Int
								Title          githubv4.String
								URL            githubv4.String
								State          githubv4.String
								IsDraft        githubv4.Boolean
								ReviewDecision githubv4.String
								UpdatedAt      githubv4.DateTime
								Author         struct {
									Login githubv4.String
								}
								Repository struct {
									NameWithOwner githubv4.String
								}
							} `graphql:"... on PullRequest"`
						}
					}
					PageInfo struct {
						EndCursor   githubv4.String
						HasNextPage bool
					}
				} `graphql:"items(first: 50, after: $cursor)"`
			} `graphql:"projectV2(number: $number)"`
		} `graphql:"organization(login: $login)"`
	}

	variables := map[string]any{
		"login":  githubv4.String(notableProjectOwner),
		"number": githubv4.Int(notableProjectNumber),
		"cursor": (*githubv4.String)(nil),
	}

	syncedAt := time.Now().UTC()
	for {
		if err := s.client.Query(ctx, &q, variables); err != nil {
			return err
		}

		for _, node := range q.Organization.ProjectV2.Items.Nodes {
			pr := node.Content.PullRequest
			// Board items that are not pull requests (draft issues / issues)
			// leave the PullRequest fragment zero-valued — skip them.
			if pr.Number == 0 {
				continue
			}
			item := models.NotablePR{
				ItemID:         string(node.ID),
				Number:         int(pr.Number),
				Title:          string(pr.Title),
				URL:            string(pr.URL),
				Repository:     string(pr.Repository.NameWithOwner),
				AuthorLogin:    string(pr.Author.Login),
				State:          string(pr.State),
				IsDraft:        bool(pr.IsDraft),
				ReviewDecision: string(pr.ReviewDecision),
				Status:         string(node.FieldValueByName.SingleSelect.Name),
				UpdatedAt:      pr.UpdatedAt.Time,
				SyncedAt:       syncedAt,
			}
			if err := s.db.Save(&item).Error; err != nil {
				return err
			}
		}

		if !q.Organization.ProjectV2.Items.PageInfo.HasNextPage {
			break
		}
		variables["cursor"] = githubv4.NewString(q.Organization.ProjectV2.Items.PageInfo.EndCursor)
	}

	// Prune items removed from the board since the last pass (anything not
	// re-stamped with this run's syncedAt).
	return s.db.Where("synced_at < ?", syncedAt).Delete(&models.NotablePR{}).Error
}
