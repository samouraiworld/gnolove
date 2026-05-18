package sync

import (
	"os"
	"testing"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func seedUser(t *testing.T, db *gorm.DB, login string, detailsSyncedAt time.Time) {
	t.Helper()
	u := models.User{ID: "u-" + login, Login: login, DetailsSyncedAt: detailsSyncedAt}
	if err := db.Create(&u).Error; err != nil {
		t.Fatalf("seed %s: %v", login, err)
	}
}

func TestSelectStaleUsers_PicksNeverSyncedAndOldEntries(t *testing.T) {
	db := newTestDB(t)
	now := time.Date(2026, 5, 18, 0, 0, 0, 0, time.UTC)
	cutoff := now.Add(-7 * 24 * time.Hour)

	seedUser(t, db, "fresh", now.Add(-1*time.Hour))                  // skip
	seedUser(t, db, "boundary", cutoff.Add(time.Second))             // skip — strictly newer than cutoff
	seedUser(t, db, "stale", cutoff.Add(-time.Hour))                 // pick
	seedUser(t, db, "never-synced", time.Time{})                     // pick

	got, err := selectStaleUsers(db, cutoff)
	if err != nil {
		t.Fatalf("selectStaleUsers: %v", err)
	}
	gotLogins := map[string]bool{}
	for _, u := range got {
		gotLogins[u.Login] = true
	}
	if !gotLogins["stale"] || !gotLogins["never-synced"] {
		t.Errorf("missing expected stale users: %v", gotLogins)
	}
	if gotLogins["fresh"] || gotLogins["boundary"] {
		t.Errorf("fresh users incorrectly selected: %v", gotLogins)
	}
}

func TestSelectStaleUsers_SkipsRowsWithoutLogin(t *testing.T) {
	db := newTestDB(t)
	// Some rows from syncRemaningUsers can land with a blank login if the
	// node lookup fails. Including them in the refresh path would hammer
	// the GraphQL endpoint with empty queries — skip them.
	now := time.Now().UTC()
	if err := db.Create(&models.User{ID: "u-noop", Login: ""}).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}
	seedUser(t, db, "real", time.Time{})

	got, err := selectStaleUsers(db, now)
	if err != nil {
		t.Fatalf("selectStaleUsers: %v", err)
	}
	if len(got) != 1 || got[0].Login != "real" {
		t.Errorf("got %+v, want only 'real'", got)
	}
}

func TestUserDetailsRefreshInterval_DefaultsAndEnv(t *testing.T) {
	t.Setenv("USER_DETAILS_REFRESH_INTERVAL_HOURS", "")
	if got := userDetailsRefreshInterval(); got != defaultUserDetailsRefreshInterval {
		t.Errorf("default = %v, want %v", got, defaultUserDetailsRefreshInterval)
	}
	t.Setenv("USER_DETAILS_REFRESH_INTERVAL_HOURS", "24")
	if got := userDetailsRefreshInterval(); got != 24*time.Hour {
		t.Errorf("env = %v, want 24h", got)
	}
	// Garbage and <=0 fall back to the default.
	for _, raw := range []string{"nope", "0", "-12"} {
		t.Run(raw, func(t *testing.T) {
			os.Setenv("USER_DETAILS_REFRESH_INTERVAL_HOURS", raw)
			defer os.Unsetenv("USER_DETAILS_REFRESH_INTERVAL_HOURS")
			if got := userDetailsRefreshInterval(); got != defaultUserDetailsRefreshInterval {
				t.Errorf("%q = %v, want default", raw, got)
			}
		})
	}
}
