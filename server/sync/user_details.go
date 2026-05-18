package sync

import (
	"os"
	"strconv"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

// defaultUserDetailsRefreshInterval is the default age at which we re-fetch a
// user's profile fields from GitHub. The handoff plan (R-2) sized this at 7d:
// long enough that the per-cycle work scales with new contributors, short
// enough that bio / follower-count drift stays bounded.
const defaultUserDetailsRefreshInterval = 7 * 24 * time.Hour

// userDetailsRefreshInterval reads USER_DETAILS_REFRESH_INTERVAL_HOURS, or
// returns the default. Anything <= 0 falls back to the default so a typo can't
// silently turn the refresh into "every cycle".
func userDetailsRefreshInterval() time.Duration {
	if raw := os.Getenv("USER_DETAILS_REFRESH_INTERVAL_HOURS"); raw != "" {
		if hours, err := strconv.Atoi(raw); err == nil && hours > 0 {
			return time.Duration(hours) * time.Hour
		}
	}
	return defaultUserDetailsRefreshInterval
}

// selectStaleUsers returns users whose details have never been refreshed,
// or were last refreshed before cutoff. Login is required so we can keep
// using the existing GraphQL `user(login:)` query without a second round-trip.
func selectStaleUsers(db *gorm.DB, cutoff time.Time) ([]models.User, error) {
	var users []models.User
	err := db.
		Where("details_synced_at IS NULL OR details_synced_at < ?", cutoff).
		Where("login != ''").
		Find(&users).Error
	return users, err
}
