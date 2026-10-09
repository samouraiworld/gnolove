package sync

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/shurcooL/githubv4"
)

func TestGitHubGatewayFailureRecoversDuringSameSyncPass(t *testing.T) {
	var requests int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if atomic.AddInt32(&requests, 1) == 1 {
			http.Error(w, "temporary upstream gateway failure", http.StatusBadGateway)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":{"viewer":{"login":"verified"}}}`))
	}))
	defer server.Close()
	client := githubv4.NewEnterpriseClient(server.URL, server.Client())
	var query struct {
		Viewer struct{ Login githubv4.String }
	}
	err := backoffRetry(context.Background(), defaultBackoffAttempts, time.Millisecond, isRetryableGitHubErr, func() error {
		return client.Query(context.Background(), &query, nil)
	})
	if err != nil {
		t.Fatalf("gateway error must recover within this sync pass: %v", err)
	}
	if requests != 2 || query.Viewer.Login != "verified" {
		t.Fatalf("requests=%d login=%q, want 2 and verified", requests, query.Viewer.Login)
	}
}

func TestGitHubHTTPRetryRemainsBoundedAndPermissionErrorsStop(t *testing.T) {
	for _, status := range []int{500, 502, 503, 504, 400, 401, 403, 404, 501} {
		t.Run(fmt.Sprint(status), func(t *testing.T) {
			err := fmt.Errorf("non-200 OK status code: %d %s body: failed", status, http.StatusText(status))
			calls := 0
			got := backoffRetry(context.Background(), defaultBackoffAttempts, time.Millisecond, isRetryableGitHubErr, func() error {
				calls++
				return err
			})
			want := 1
			if status == 500 || status == 502 || status == 503 || status == 504 {
				want = defaultBackoffAttempts
			}
			if !errors.Is(got, err) || calls != want {
				t.Fatalf("error=%v calls=%d, want original error and %d calls", got, calls, want)
			}
		})
	}
	if !isRetryableGitHubErr(fmt.Errorf("fetch PRs: %w", errors.New("non-200 OK status code: 502 Bad Gateway body: failed"))) {
		t.Fatal("wrapped SDK gateway error must retain its classification")
	}
	if isRetryableGitHubErr(errors.New("non-200 OK status code: 400 Bad Request body: non-200 OK status code: 502 Bad Gateway")) {
		t.Fatal("error body must not override HTTP status")
	}
}

func TestGitHubGatewayRetryStopsWhenContextCancelled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	calls := 0
	err := backoffRetry(ctx, defaultBackoffAttempts, time.Hour, isRetryableGitHubErr, func() error {
		calls++
		cancel()
		return errors.New("non-200 OK status code: 502 Bad Gateway body: failed")
	})
	if !errors.Is(err, context.Canceled) || calls != 1 {
		t.Fatalf("error=%v calls=%d, want cancellation after one request", err, calls)
	}
}
