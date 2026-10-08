package db

import (
	"database/sql"
	"fmt"
	"net/url"
	"os"
	"path/filepath"

	"gorm.io/gorm"
)

// Preserve the legacy schema before any migration. A snapshot becomes visible
// at the final path only after VACUUM and verification complete successfully.
func BackupBeforeRepositoryUpgrade(database *gorm.DB, path string) error {
	if !database.Migrator().HasTable("repositories") || database.Migrator().HasColumn("repositories", "listed") {
		return nil
	}
	backup := path + ".before-dev-report-registry.sqlite"
	if _, err := os.Stat(backup); err == nil {
		return validateRepositoryBackup(backup)
	} else if !os.IsNotExist(err) {
		return err
	}
	temporary, err := os.CreateTemp(filepath.Dir(backup), ".dev-report-registry-*.sqlite")
	if err != nil {
		return fmt.Errorf("create repository backup: %w", err)
	}
	temporaryPath := temporary.Name()
	defer os.Remove(temporaryPath)
	if err := temporary.Close(); err != nil {
		return err
	}
	// SQLite permits an existing empty target; this random temporary file cannot
	// be mistaken for a completed backup after a process interruption.
	if err := database.Exec("VACUUM INTO ?", temporaryPath).Error; err != nil {
		return fmt.Errorf("backup before repository registry migration: %w", err)
	}
	if err := validateRepositoryBackup(temporaryPath); err != nil {
		return err
	}
	completed, err := os.Open(temporaryPath)
	if err != nil {
		return err
	}
	syncErr := completed.Sync()
	closeErr := completed.Close()
	if syncErr != nil {
		return syncErr
	}
	if closeErr != nil {
		return closeErr
	}
	// Hard-link publication is atomic and cannot replace a valid backup created
	// concurrently. Both paths share a directory/filesystem.
	if err := os.Link(temporaryPath, backup); err != nil {
		if os.IsExist(err) {
			return validateRepositoryBackup(backup)
		}
		return fmt.Errorf("publish repository backup: %w", err)
	}
	return nil
}

func validateRepositoryBackup(path string) error {
	absolute, err := filepath.Abs(path)
	if err != nil {
		return err
	}
	uri := (&url.URL{Scheme: "file", Path: absolute, RawQuery: "mode=ro"}).String()
	snapshot, err := sql.Open("sqlite3", uri)
	if err != nil {
		return fmt.Errorf("invalid repository backup: %w", err)
	}
	defer snapshot.Close()
	var integrity string
	if err := snapshot.QueryRow("PRAGMA integrity_check").Scan(&integrity); err != nil || integrity != "ok" {
		return fmt.Errorf("invalid repository backup integrity (%q): %v", integrity, err)
	}
	var tables, migrated int
	if err := snapshot.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='repositories'").Scan(&tables); err != nil {
		return fmt.Errorf("invalid repository backup schema: %w", err)
	}
	if err := snapshot.QueryRow("SELECT COUNT(*) FROM pragma_table_info('repositories') WHERE name='listed'").Scan(&migrated); err != nil {
		return fmt.Errorf("invalid repository backup columns: %w", err)
	}
	if tables != 1 || migrated != 0 {
		return fmt.Errorf("invalid repository backup: expected legacy repositories schema")
	}
	return nil
}
