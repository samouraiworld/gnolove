package sync

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/shurcooL/githubv4"
	"go.uber.org/zap"
)

// Exercise the worker, SDK pagination and SQLite writes: page one is already
// persisted when page two fails, so restarting the stage moves MAX(updated_at).
func TestGitHubPaginationRetryPreservesOlderPages(t *testing.T) {
	for _, kind := range []string{"pullRequests", "issues", "milestones"} {
		for _, scenario := range []string{"recovery", "exhausted-initial", "exhausted-incremental", "cancelled-incremental"} {
			t.Run(kind+"/"+scenario, func(t *testing.T) {
				t.Parallel()
				db := newTestDB(t)
				if err := db.AutoMigrate(&models.Repository{}, &models.PullRequest{}, &models.Review{}, &models.Issue{}, &models.Milestone{}, &models.Commit{}); err != nil {
					t.Fatal(err)
				}
				repo := models.Repository{ID: "org/project", Owner: "org", Name: "project", BaseBranch: "main", Listed: true, Public: true}
				previous := time.Date(2026, 10, 1, 12, 0, 0, 0, time.UTC)
				if strings.HasSuffix(scenario, "incremental") {
					repo.LastSyncedAt = &previous
				}
				ctx, cancel := context.WithCancel(context.Background())
				defer cancel()
				failures := 1
				if strings.HasPrefix(scenario, "exhausted") {
					failures = defaultBackoffAttempts
				}
				if err := db.Create(&repo).Error; err != nil {
					t.Fatal(err)
				}
				pageOneCalls, pageTwoCalls := 0, 0
				server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					var req struct {
						Query     string
						Variables map[string]interface{}
					}
					if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
						t.Error(err)
						w.WriteHeader(400)
						return
					}
					w.Header().Set("Content-Type", "application/json")
					if strings.Contains(req.Query, kind+"(") {
						nodes, next := `[{"id":"newest","createdAt":"2026-01-01T12:00:00Z","updatedAt":"2026-10-08T12:00:00Z"},{"id":"middle","createdAt":"2026-01-01T12:00:00Z","updatedAt":"2026-10-07T12:00:00Z"}]`, true
						if req.Variables["cursor"] == "page-two" {
							pageTwoCalls++
							if scenario == "cancelled-incremental" && pageTwoCalls == 1 {
								cancel()
							}
							if pageTwoCalls <= failures {
								http.Error(w, "gateway unavailable", 502)
								return
							}
							nodes, next = `[{"id":"oldest","createdAt":"2026-01-01T12:00:00Z","updatedAt":"2026-10-06T12:00:00Z"}]`, false
						} else {
							pageOneCalls++
						}
						fmt.Fprintf(w, `{"data":{"repository":{"isPrivate":false,"%s":{"nodes":%s,"pageInfo":{"endCursor":"page-two","hasNextPage":%t}}}}}`, kind, nodes, next)
						return
					}
					switch {
					case strings.Contains(req.Query, "nameWithOwner"):
						fmt.Fprint(w, `{"data":{"repository":{"nameWithOwner":"org/project","isPrivate":false,"defaultBranchRef":{"name":"main"}}}}`)
					case strings.Contains(req.Query, "mentionableUsers"):
						fmt.Fprint(w, `{"data":{"repository":{"isPrivate":false,"mentionableUsers":{"nodes":[],"pageInfo":{"hasNextPage":false}}}}}`)
					case strings.Contains(req.Query, "pullRequests("):
						fmt.Fprint(w, `{"data":{"repository":{"isPrivate":false,"pullRequests":{"nodes":[],"pageInfo":{"hasNextPage":false}}}}}`)
					case strings.Contains(req.Query, "issues("):
						fmt.Fprint(w, `{"data":{"repository":{"isPrivate":false,"issues":{"nodes":[],"pageInfo":{"hasNextPage":false}}}}}`)
					case strings.Contains(req.Query, "milestones("):
						fmt.Fprint(w, `{"data":{"repository":{"isPrivate":false,"milestones":{"nodes":[],"pageInfo":{"hasNextPage":false}}}}}`)
					default:
						fmt.Fprint(w, `{"data":{"repository":{"isPrivate":false,"ref":{"target":{"history":{"nodes":[],"pageInfo":{"hasNextPage":false}}}}}}}`)
					}
				}))
				defer server.Close()
				s := &Syncer{db: db, client: githubv4.NewEnterpriseClient(server.URL, server.Client()), logger: zap.NewNop().Sugar()}
				s.syncOneRepo(ctx, repo, 0)
				if scenario != "recovery" {
					var incomplete models.Repository
					if err := db.First(&incomplete, "id = ?", repo.ID).Error; err != nil {
						t.Fatal(err)
					}
					if incomplete.SyncError == "" {
						t.Fatal("incomplete pass must retain an error")
					}
					if repo.LastSyncedAt == nil {
						if incomplete.LastSyncedAt != nil {
							t.Fatal("initial backfill advanced checkpoint before page two")
						}
					} else if incomplete.LastSyncedAt == nil || !incomplete.LastSyncedAt.Equal(previous) {
						t.Fatal("failed/cancelled pass advanced previous successful checkpoint")
					}
					var partial int64
					table := map[string]string{"pullRequests": "pull_requests", "issues": "issues", "milestones": "milestones"}[kind]
					if err := db.Table(table).Count(&partial).Error; err != nil || partial != 2 {
						t.Fatalf("fixture lost partial first page: rows=%d err=%v", partial, err)
					}
					// A fresh cycle reads persisted sync status, even with a stale registry model.
					s.syncOneRepo(context.Background(), repo, 0)
				}
				table := map[string]string{"pullRequests": "pull_requests", "issues": "issues", "milestones": "milestones"}[kind]
				var count int64
				if err := db.Table(table).Where("repository_id = ?", repo.ID).Count(&count).Error; err != nil {
					t.Fatal(err)
				}
				wantPageOne, wantPageTwo := 1, 2
				if scenario != "recovery" {
					wantPageOne, wantPageTwo = 2, failures+1
				}
				if count != 3 || pageTwoCalls != wantPageTwo {
					t.Fatalf("rows=%d page-one=%d page-two=%d: older page was skipped after retry", count, pageOneCalls, pageTwoCalls)
				}
				if err := db.First(&repo, "id = ?", repo.ID).Error; err != nil {
					t.Fatal(err)
				}
				if repo.LastSyncedAt == nil || repo.SyncError != "" {
					t.Fatalf("complete ingestion must confirm checkpoint: %+v", repo)
				}
				if pageOneCalls != wantPageOne {
					t.Fatalf("retried stage instead of failing page: page-one=%d", pageOneCalls)
				}
			})
		}
	}
}
