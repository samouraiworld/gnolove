package models

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func registryDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { sqlDB.Close() })
	if err := db.AutoMigrate(&Repository{}, &Commit{}, &Review{}, &PullRequest{}, &Issue{}, &Milestone{}, &NotablePR{}, &User{}); err != nil {
		t.Fatal(err)
	}
	return db
}

func TestRepositoryRegistryProductionAndLegacyEnv(t *testing.T) {
	t.Setenv("GITHUB_REPOSITORIES", "private/secret/main")
	t.Setenv("REPOSITORIES_CONFIG_PATH", "../config/repositories.yaml")
	repos, err := GetRepositoriesFromConfig()
	if err != nil {
		t.Fatal(err)
	}
	if len(repos) != 59 {
		t.Fatalf("got %d repositories", len(repos))
	}
	branches := map[string]string{}
	for _, r := range repos {
		branches[r.ID] = r.BaseBranch
	}
	if branches["gnoswap-labs/gnoswap-interface"] != "develop" || branches["allinbits/gno-realms"] != "master" || branches["private/secret"] != "" || branches["gnolang/gnopls"] != "" {
		t.Fatal(branches)
	}
}

func TestRepositoryRegistryRejectsInvalidEntries(t *testing.T) {
	valid := "schemaVersion: 1\nrepositories:\n  - id: gnolang/gno\n    branch: master\n    category: core\n    status: active\n"
	for name, body := range map[string]string{"unknown field": valid + "    secret: true\n", "bad id": strings.Replace(valid, "gnolang/gno", "../gno", 1), "category": strings.Replace(valid, "core", "bogus", 1), "status": strings.Replace(valid, "active", "private", 1), "duplicate": valid + "  - id: GNOLANG/GNO\n    branch: master\n    category: core\n    status: active\n", "alias collision": valid + "    aliases: [GNOLANG/GNO]\n"} {
		t.Run(name, func(t *testing.T) {
			p := filepath.Join(t.TempDir(), "repos.yaml")
			os.WriteFile(p, []byte(body), 0600)
			if _, err := LoadRepositoryRegistry(p); err == nil {
				t.Fatal("accepted invalid registry")
			}
		})
	}
}

func TestRepositoryReconcilePreservesHistoryAndIsIdempotent(t *testing.T) {
	db := registryDB(t)
	old := Repository{ID: "gnolang/gnopls", Public: true, Listed: true}
	db.Create(&old)
	pr := PullRequest{ID: "pr", RepositoryID: old.ID, Title: "history"}
	db.Create(&pr)
	commit := Commit{ID: "commit", RepositoryID: old.ID}
	db.Create(&commit)
	now := time.Now()
	target := Repository{ID: "gnoverse/gnopls", Name: "gnopls", Owner: "gnoverse", BaseBranch: "main", Status: "active", Listed: true, Stars: new(int), LastSyncedAt: &now}
	db.Create(&target)
	target.Aliases = []string{old.ID}
	for range 2 {
		if err := ReconcileRepositories(db, []Repository{target}); err != nil {
			t.Fatal(err)
		}
	}
	db.First(&pr, "id = ?", "pr")
	if pr.Title != "history" || pr.RepositoryID != target.ID {
		t.Fatal(pr)
	}
	db.First(&target, "id = ?", target.ID)
	if target.LastSyncedAt == nil || target.Public {
		t.Fatal("checkpoint lost or visibility not revalidated")
	}
	var count int64
	db.Model(&Repository{}).Count(&count)
	if count != 2 {
		t.Fatalf("history row removed: %d", count)
	}
}

func TestPublicFilterProtectsFindScanCountPreloadAndNotable(t *testing.T) {
	db := registryDB(t)
	for _, r := range []Repository{{ID: "org/public", Listed: true, Public: true}, {ID: "org/private", Listed: true}, {ID: "org/removed", Public: true}} {
		db.Create(&r)
		db.Create(&Commit{ID: r.ID, AuthorID: "u", RepositoryID: r.ID})
		db.Create(&NotablePR{ItemID: r.ID, Repository: r.ID})
	}
	db.Create(&User{ID: "u", Login: "contributor"})
	if err := InstallPublicRepositoryFilter(db); err != nil {
		t.Fatal(err)
	}
	var rows []Commit
	db.Find(&rows)
	if len(rows) != 1 || rows[0].RepositoryID != "org/public" {
		t.Fatal(rows)
	}
	var count int64
	db.Model(&Commit{}).Count(&count)
	if count != 1 {
		t.Fatal(count)
	}
	var scan []struct{ Title string }
	db.Table("commits").Select("title").Scan(&scan)
	if len(scan) != 1 {
		t.Fatal(scan)
	}
	var user User
	if err := db.Preload("Commits").First(&user).Error; err != nil {
		t.Fatal(err)
	}
	if len(user.Commits) != 1 {
		t.Fatal(user.Commits)
	}
	var notable []NotablePR
	db.Find(&notable)
	if len(notable) != 1 {
		t.Fatal(notable)
	}
	// Historical data stays stored when visibility changes.
	db.Model(&Repository{}).Where("id = ?", "org/public").Update("public", false)
	rows = nil
	db.Find(&rows)
	if len(rows) != 0 {
		t.Fatal("private history leaked")
	}
}
