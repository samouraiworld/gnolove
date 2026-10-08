package db

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
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
