package sync

import (
	"context"
	"errors"
	"os"
	"sync/atomic"
	"testing"
	"time"
)

func TestSyncWorkerCount_DefaultAndEnv(t *testing.T) {
	t.Setenv("SYNC_WORKERS", "")
	if got := syncWorkerCount(); got != defaultSyncWorkers {
		t.Errorf("default = %d, want %d", got, defaultSyncWorkers)
	}
	t.Setenv("SYNC_WORKERS", "8")
	if got := syncWorkerCount(); got != 8 {
		t.Errorf("env=8 → %d, want 8", got)
	}
	t.Setenv("SYNC_WORKERS", "100")
	if got := syncWorkerCount(); got != 16 {
		t.Errorf("env=100 → %d, want 16 (clamp)", got)
	}
	for _, raw := range []string{"nope", "0", "-3"} {
		t.Run(raw, func(t *testing.T) {
			os.Setenv("SYNC_WORKERS", raw)
			defer os.Unsetenv("SYNC_WORKERS")
			if got := syncWorkerCount(); got != defaultSyncWorkers {
				t.Errorf("%q → %d, want default", raw, got)
			}
		})
	}
}

func TestIsRateLimitErr(t *testing.T) {
	cases := []struct {
		err  error
		want bool
	}{
		{nil, false},
		{errors.New("API rate limit exceeded for user X"), true},
		{errors.New("You have exceeded a secondary rate limit"), true},
		{errors.New("403 Forbidden: abuse detection mechanism"), true},
		{errors.New("404 not found"), false},
		{errors.New("connection reset"), false},
	}
	for _, c := range cases {
		if got := isRateLimitErr(c.err); got != c.want {
			t.Errorf("isRateLimitErr(%v) = %v, want %v", c.err, got, c.want)
		}
	}
}

func TestBackoffRetry_RetriesUntilSuccess(t *testing.T) {
	var calls int32
	err := backoffRetry(context.Background(), 4, time.Millisecond, isRateLimitErr, func() error {
		n := atomic.AddInt32(&calls, 1)
		if n < 3 {
			return errors.New("API rate limit exceeded")
		}
		return nil
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if calls != 3 {
		t.Errorf("calls = %d, want 3", calls)
	}
}

func TestBackoffRetry_DoesNotRetryNonRetryable(t *testing.T) {
	var calls int32
	got := backoffRetry(context.Background(), 4, time.Millisecond, isRateLimitErr, func() error {
		atomic.AddInt32(&calls, 1)
		return errors.New("404 not found")
	})
	if got == nil || got.Error() != "404 not found" {
		t.Errorf("err = %v, want '404 not found'", got)
	}
	if calls != 1 {
		t.Errorf("calls = %d, want 1 (no retry)", calls)
	}
}

func TestBackoffRetry_ExhaustsAndReturnsLastErr(t *testing.T) {
	var calls int32
	err := backoffRetry(context.Background(), 3, time.Millisecond, isRateLimitErr, func() error {
		atomic.AddInt32(&calls, 1)
		return errors.New("API rate limit exceeded")
	})
	if err == nil {
		t.Fatal("want error")
	}
	if calls != 3 {
		t.Errorf("calls = %d, want 3", calls)
	}
}

func TestBackoffRetry_CtxCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	var calls int32
	err := backoffRetry(ctx, 4, 50*time.Millisecond, isRateLimitErr, func() error {
		atomic.AddInt32(&calls, 1)
		return errors.New("API rate limit exceeded")
	})
	if err == nil {
		t.Error("want context error")
	}
	if calls > 1 {
		t.Errorf("calls = %d, want 0 or 1 (ctx cancelled)", calls)
	}
}
