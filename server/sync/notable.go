package sync

import (
	"context"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/shurcooL/githubv4"
)

// gnolang "Notable PRs by Area" board — https://github.com/orgs/gnolang/projects/66
const (
	notableProjectOwner  = "gnolang"
	notableProjectNumber = 66
)

// syncNotableBoard mirrors the gnolang "Notable PRs" GitHub Project (#66) into
// the local DB: the board's PR items + Status/Main Area columns, plus per-PR
// metadata (author, requested reviewers, completed reviews, labels, size).
//
// REQUIRES that GITHUB_API_TOKEN carries the `read:project` scope (classic PAT)
// or `Projects: Read` (fine-grained) AND can see project #66. Without it the
// query returns an authorization error; the caller logs and continues (this
// sync is best-effort and must never break the main repo sync).
func (s *Syncer) syncNotableBoard(ctx context.Context) error {
	type singleSelect struct {
		SingleSelect struct {
			Name githubv4.String
		} `graphql:"... on ProjectV2ItemFieldSingleSelectValue"`
	}

	var q struct {
		Organization struct {
			ProjectV2 struct {
				Items struct {
					Nodes []struct {
						ID     githubv4.String
						Status singleSelect `graphql:"status: fieldValueByName(name: \"Status\")"`
						Area   singleSelect `graphql:"area: fieldValueByName(name: \"Main Area\")"`
						Content struct {
							PullRequest struct {
								Number         githubv4.Int
								Title          githubv4.String
								URL            githubv4.String
								State          githubv4.String
								IsDraft        githubv4.Boolean
								ReviewDecision githubv4.String
								Additions      githubv4.Int
								Deletions      githubv4.Int
								CreatedAt      githubv4.DateTime
								UpdatedAt      githubv4.DateTime
								Author         struct {
									Login     githubv4.String
									AvatarURL githubv4.String `graphql:"avatarUrl"`
								}
								Repository struct {
									NameWithOwner githubv4.String
								}
								Labels struct {
									Nodes []struct {
										Name  githubv4.String
										Color githubv4.String
									}
								} `graphql:"labels(first: 8)"`
								Assignees struct {
									Nodes []struct {
										Login githubv4.String
									}
								} `graphql:"assignees(first: 5)"`
								ReviewRequests struct {
									Nodes []struct {
										RequestedReviewer struct {
											User struct {
												Login githubv4.String
											} `graphql:"... on User"`
											Team struct {
												Name githubv4.String
											} `graphql:"... on Team"`
										}
									}
								} `graphql:"reviewRequests(first: 8)"`
								LatestReviews struct {
									Nodes []struct {
										Author struct {
											Login githubv4.String
										}
										State githubv4.String
									}
								} `graphql:"latestReviews(first: 10)"`
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

			labels := make([]models.NotablePRLabel, 0, len(pr.Labels.Nodes))
			for _, l := range pr.Labels.Nodes {
				labels = append(labels, models.NotablePRLabel{Name: string(l.Name), Color: string(l.Color)})
			}

			assignees := make([]string, 0, len(pr.Assignees.Nodes))
			for _, a := range pr.Assignees.Nodes {
				assignees = append(assignees, string(a.Login))
			}

			// Requested reviewers still pending (GitHub drops them once they review).
			reviewers := make([]string, 0, len(pr.ReviewRequests.Nodes))
			for _, r := range pr.ReviewRequests.Nodes {
				if login := string(r.RequestedReviewer.User.Login); login != "" {
					reviewers = append(reviewers, login)
				} else if team := string(r.RequestedReviewer.Team.Name); team != "" {
					reviewers = append(reviewers, "@"+team)
				}
			}

			reviews := make([]models.NotablePRReview, 0, len(pr.LatestReviews.Nodes))
			for _, rv := range pr.LatestReviews.Nodes {
				login := string(rv.Author.Login)
				if login == "" {
					continue
				}
				reviews = append(reviews, models.NotablePRReview{Login: login, State: string(rv.State)})
			}

			item := models.NotablePR{
				ItemID:             string(node.ID),
				Number:             int(pr.Number),
				Title:              string(pr.Title),
				URL:                string(pr.URL),
				Repository:         string(pr.Repository.NameWithOwner),
				AuthorLogin:        string(pr.Author.Login),
				AuthorAvatarURL:    string(pr.Author.AvatarURL),
				State:              string(pr.State),
				IsDraft:            bool(pr.IsDraft),
				ReviewDecision:     string(pr.ReviewDecision),
				Status:             string(node.Status.SingleSelect.Name),
				MainArea:           string(node.Area.SingleSelect.Name),
				Additions:          int(pr.Additions),
				Deletions:          int(pr.Deletions),
				Labels:             labels,
				Assignees:          assignees,
				RequestedReviewers: reviewers,
				Reviews:            reviews,
				OpenedAt:           pr.CreatedAt.Time,
				PRUpdatedAt:        pr.UpdatedAt.Time,
				SyncedAt:           syncedAt,
			}
			// Save replaces serializer-json columns wholesale; use Save (upsert by PK).
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
