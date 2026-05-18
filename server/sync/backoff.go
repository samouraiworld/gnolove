package sync

import (
	"context"
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

// defaultSyncWorkers is the per-cycle concurrent repository count when the
// SYNC_WORKERS env var is unset. Tuned to four — high enough to amortise
// GitHub round-trip latency across ~50 repos, low enough to keep sqlite
// writer contention bounded.
const defaultSyncWorkers = 4

// syncWorkerCount reads SYNC_WORKERS, clamped to [1, 16]. Out-of-range or
// non-numeric values fall back to the default — same fail-closed posture
// as the user-details interval.
func syncWorkerCount() int {
	raw := os.Getenv("SYNC_WORKERS")
	if raw == "" {
		return defaultSyncWorkers
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 {
		return defaultSyncWorkers
	}
	if n > 16 {
		return 16
	}
	return n
}

const (
	defaultBackoffAttempts = 4
	defaultBackoffBase     = 2 * time.Second
)

// isRateLimitErr matches the error strings GitHub's GraphQL endpoint returns
// when we trip its primary or secondary rate limit. Keep this list narrow
// so we don't accidentally retry-loop on real errors.
func isRateLimitErr(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	switch {
	case strings.Contains(msg, "rate limit"),
		strings.Contains(msg, "secondary rate"),
		strings.Contains(msg, "abuse detection"),
		strings.Contains(msg, "403 forbidden"):
		return true
	}
	return false
}

// backoffRetry runs fn up to attempts times with exponential delay, but only
// re-runs when isRetryable(err) is true. Returns the last error if exhausted.
// ctx cancellation aborts immediately.
func backoffRetry(ctx context.Context, attempts int, base time.Duration, isRetryable func(error) bool, fn func() error) error {
	if attempts < 1 {
		attempts = 1
	}
	var lastErr error
	for i := 0; i < attempts; i++ {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		err := fn()
		if err == nil {
			return nil
		}
		lastErr = err
		if !isRetryable(err) || i == attempts-1 {
			return err
		}
		delay := base * time.Duration(1<<i) // 2s, 4s, 8s, ...
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
		}
	}
	if lastErr == nil {
		lastErr = errors.New("backoffRetry: exhausted with no recorded error")
	}
	return lastErr
}
