package db

import (
	"fmt"
	"gorm.io/gorm"
	"os"
)

// The first registry rollout changes repository references. Preserve the old
// schema and rows using SQLite's consistent backup, before any migration runs.
func BackupBeforeRepositoryUpgrade(database *gorm.DB, path string) error {
	if !database.Migrator().HasTable("repositories") || database.Migrator().HasColumn("repositories", "listed") {
		return nil
	}
	backup := path + ".before-dev-report-registry.sqlite"
	if _, err := os.Stat(backup); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return err
	}
	if err := database.Exec("VACUUM INTO ?", backup).Error; err != nil {
		return fmt.Errorf("backup before repository registry migration: %w", err)
	}
	return nil
}
