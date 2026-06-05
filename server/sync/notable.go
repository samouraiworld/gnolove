package sync

import (
	"context"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/shurcooL/githubv4"
)

// maxPagesPerBoard bounds a single board's sync (50 items/page → ~1000 items).
// Large boards (e.g. #38) are mirrored up to this cap; overflow is logged, not
// silently dropped.
const maxPagesPerBoard = 20

// syncBoard mirrors one gnolang GitHub Project board into the local DB: its
// items (PRs, plus issues when board.IncludeIssues) with Status + area columns
// and per-item metadata (author, requested reviewers, reviews, labels, size).
//
// REQUIRES that GITHUB_API_TOKEN carries the `read:project` scope (classic PAT)
// or `Projects: Read` (fine-grained) AND can see the project. Without it the
// query returns an authorization error; the caller logs and continues (this
// sync is best-effort and must never break the main repo sync).
func (s *Syncer) syncBoard(ctx context.Context, board models.BoardConfig) error {
	type singleSelect struct {
		SingleSelect struct {
			Name githubv4.String
		} `graphql:"... on ProjectV2ItemFieldSingleSelectValue"`
	}
	type ghLabel struct {
		Name  githubv4.String
		Color githubv4.String
	}

	var q struct {
		Organization struct {
			ProjectV2 struct {
				Items struct {
					Nodes []struct {
						ID      githubv4.String
						Status  singleSelect `graphql:"status: fieldValueByName(name: \"Status\")"`
						Area    singleSelect `graphql:"area: fieldValueByName(name: \"Main Area\")"`
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
									Nodes []ghLabel
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
							Issue struct {
								Number    githubv4.Int
								Title     githubv4.String
								URL       githubv4.String
								State     githubv4.String
								CreatedAt githubv4.DateTime
								UpdatedAt githubv4.DateTime
								Author    struct {
									Login     githubv4.String
									AvatarURL githubv4.String `graphql:"avatarUrl"`
								}
								Repository struct {
									NameWithOwner githubv4.String
								}
								Labels struct {
									Nodes []ghLabel
								} `graphql:"labels(first: 8)"`
								Assignees struct {
									Nodes []struct {
										Login githubv4.String
									}
								} `graphql:"assignees(first: 5)"`
							} `graphql:"... on Issue"`
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
		"login":  githubv4.String(board.Owner),
		"number": githubv4.Int(board.Number),
		"cursor": (*githubv4.String)(nil),
	}

	toLabels := func(nodes []ghLabel) []models.NotablePRLabel {
		labels := make([]models.NotablePRLabel, 0, len(nodes))
		for _, l := range nodes {
			labels = append(labels, models.NotablePRLabel{Name: string(l.Name), Color: string(l.Color)})
		}
		return labels
	}

	syncedAt := time.Now().UTC()
	for page := 0; ; page++ {
		if page >= maxPagesPerBoard {
			s.logger.Warnf("notable board %q hit page cap (%d pages); remaining items not synced this pass", board.ID, maxPagesPerBoard)
			break
		}
		if err := s.client.Query(ctx, &q, variables); err != nil {
			return err
		}

		for _, node := range q.Organization.ProjectV2.Items.Nodes {
			var item models.NotablePR

			if pr := node.Content.PullRequest; pr.Number != 0 {
				labels := toLabels(pr.Labels.Nodes)

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

				item = models.NotablePR{
					ItemID:             string(node.ID),
					BoardID:            board.ID,
					ItemType:           "pr",
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
					MainArea:           deriveArea(board, string(node.Area.SingleSelect.Name), labels),
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
			} else if iss := node.Content.Issue; board.IncludeIssues && iss.Number != 0 {
				labels := toLabels(iss.Labels.Nodes)

				assignees := make([]string, 0, len(iss.Assignees.Nodes))
				for _, a := range iss.Assignees.Nodes {
					assignees = append(assignees, string(a.Login))
				}

				item = models.NotablePR{
					ItemID:          string(node.ID),
					BoardID:         board.ID,
					ItemType:        "issue",
					Number:          int(iss.Number),
					Title:           string(iss.Title),
					URL:             string(iss.URL),
					Repository:      string(iss.Repository.NameWithOwner),
					AuthorLogin:     string(iss.Author.Login),
					AuthorAvatarURL: string(iss.Author.AvatarURL),
					State:           string(iss.State),
					Status:          string(node.Status.SingleSelect.Name),
					MainArea:        deriveArea(board, string(node.Area.SingleSelect.Name), labels),
					Labels:          labels,
					Assignees:       assignees,
					OpenedAt:        iss.CreatedAt.Time,
					PRUpdatedAt:     iss.UpdatedAt.Time,
					SyncedAt:        syncedAt,
				}
			} else {
				// Draft issues, or issues on a PR-only board — skip.
				continue
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

	// Prune items removed from THIS board since the last pass (anything not
	// re-stamped with this run's syncedAt). Scoped by board so boards don't
	// wipe each other's rows.
	return s.db.Where("board_id = ? AND synced_at < ?", board.ID, syncedAt).
		Delete(&models.NotablePR{}).Error
}

// deriveArea resolves an item's area for the given board: the single-select
// field value for field-source boards, else the first a/* label mapped to its
// canonical area for label-source boards ("" when none match).
func deriveArea(board models.BoardConfig, fieldArea string, labels []models.NotablePRLabel) string {
	if board.AreaSource == "field" {
		return fieldArea
	}
	for _, l := range labels {
		if area, ok := board.AreaLabels[l.Name]; ok {
			return area
		}
	}
	return ""
}
