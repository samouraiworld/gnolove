package db

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"os"
	"path/filepath"
	"testing"
)

func TestRegistryBackupPreservesOldRows(t *testing.T) {
	path := filepath.Join(t.TempDir(), "data.sqlite")
	database, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, _ := database.DB()
	defer sqlDB.Close()
	database.Exec("CREATE TABLE repositories (id TEXT PRIMARY KEY)")
	database.Exec("INSERT INTO repositories VALUES ('gnolang/gnopls')")
	if err := BackupBeforeRepositoryUpgrade(database, path); err != nil {
		t.Fatal(err)
	}
	database.Exec("UPDATE repositories SET id = 'gnoverse/gnopls'")
	if err := BackupBeforeRepositoryUpgrade(database, path); err != nil {
		t.Fatal(err)
	}
	backup, err := gorm.Open(sqlite.Open(path+".before-dev-report-registry.sqlite"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	conn, _ := backup.DB()
	defer conn.Close()
	var id string
	backup.Raw("SELECT id FROM repositories").Scan(&id)
	if id != "gnolang/gnopls" {
		t.Fatal("original backup overwritten", id)
	}
}

func TestRegistryBackupRejectsInvalidExistingSnapshots(t *testing.T) {
	for _, tc := range []struct {
		name string
		data []byte
	}{{"empty", nil}, {"corrupt", []byte("interrupted SQLite data")}} {
		t.Run(tc.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "data.sqlite")
			database, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
			if err != nil {
				t.Fatal(err)
			}
			conn, _ := database.DB()
			defer conn.Close()
			database.Exec("CREATE TABLE repositories (id TEXT PRIMARY KEY)")
			backup := path + ".before-dev-report-registry.sqlite"
			if err := os.WriteFile(backup, tc.data, 0600); err != nil {
				t.Fatal(err)
			}
			if err := BackupBeforeRepositoryUpgrade(database, path); err == nil {
				t.Fatal("accepted unusable snapshot")
			}
			// Operator moves the invalid evidence aside, then startup can retry safely.
			if err := os.Rename(backup, backup+".invalid"); err != nil {
				t.Fatal(err)
			}
			if err := BackupBeforeRepositoryUpgrade(database, path); err != nil {
				t.Fatal(err)
			}
			if err := validateRepositoryBackup(backup); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestRegistryBackupIgnoresInterruptedTemporarySnapshot(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "data.sqlite")
	database, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	conn, _ := database.DB()
	defer conn.Close()
	database.Exec("CREATE TABLE repositories (id TEXT PRIMARY KEY)")
	orphan := filepath.Join(dir, ".dev-report-registry-interrupted.sqlite")
	if err := os.WriteFile(orphan, nil, 0600); err != nil {
		t.Fatal(err)
	}
	if err := BackupBeforeRepositoryUpgrade(database, path); err != nil {
		t.Fatal(err)
	}
	if err := validateRepositoryBackup(path + ".before-dev-report-registry.sqlite"); err != nil {
		t.Fatal(err)
	}
	snapshots, err := filepath.Glob(filepath.Join(dir, ".dev-report-registry-*.sqlite"))
	if err != nil || len(snapshots) != 1 || snapshots[0] != orphan {
		t.Fatal("temporary backup was not cleaned up", snapshots, err)
	}
}

func TestRegistryBackupFailureCannotPublishTemporaryFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "data.sqlite")
	database, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	conn, _ := database.DB()
	defer conn.Close()
	database.Exec("CREATE TABLE repositories (id TEXT PRIMARY KEY)")
	tx := database.Begin()
	defer tx.Rollback()
	// SQLite rejects VACUUM inside a transaction, exercising its failure path.
	if err := BackupBeforeRepositoryUpgrade(tx, path); err == nil {
		t.Fatal("VACUUM failure ignored")
	}
	if _, err := os.Stat(path + ".before-dev-report-registry.sqlite"); !os.IsNotExist(err) {
		t.Fatal("failed backup published", err)
	}
	files, _ := filepath.Glob(filepath.Join(dir, ".dev-report-registry-*.sqlite"))
	if len(files) != 0 {
		t.Fatal("failed temporary snapshot left behind", files)
	}
}
