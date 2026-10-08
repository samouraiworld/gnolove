package handler

import (
	"encoding/json"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRepositoryStatsNoFanoutAndPublicOnly(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(1)
	defer sqlDB.Close()
	if err := db.AutoMigrate(&models.Repository{}, &models.PullRequest{}, &models.User{}, &models.Review{}, &models.Issue{}, &models.Commit{}); err != nil {
		t.Fatal(err)
	}
	now := time.Now().UTC().Add(-time.Hour)
	old := now.AddDate(0, -2, 0)
	for _, r := range []models.Repository{{ID: "org/public", Public: true, Listed: true}, {ID: "org/private", Listed: true}} {
		db.Create(&r)
	}
	for _, p := range []models.PullRequest{{ID: "new", RepositoryID: "org/public", State: "MERGED", CreatedAt: old, MergedAt: &now, AuthorID: "a"}, {ID: "old", RepositoryID: "org/public", State: "MERGED", MergedAt: &old, AuthorID: "a"}, {ID: "open", RepositoryID: "org/public", State: "OPEN", CreatedAt: old, AuthorID: "a"}, {ID: "secret", RepositoryID: "org/private", Title: "secret", State: "MERGED", MergedAt: &now}} {
		db.Create(&p)
	}
	for _, c := range []models.Commit{{ID: "c1", RepositoryID: "org/public", AuthorID: "a", CreatedAt: now}, {ID: "c2", RepositoryID: "org/public", AuthorID: "a", CreatedAt: now}} {
		db.Create(&c)
	}
	db.Create(&models.Issue{ID: "i", RepositoryID: "org/public", AuthorID: "b", CreatedAt: now})
	db.Create(&models.Review{ID: "r", RepositoryID: "org/public", AuthorID: "a", CreatedAt: now})
	if err := models.InstallPublicRepositoryFilter(db); err != nil {
		t.Fatal(err)
	}
	rec := httptest.NewRecorder()
	HandleGetRepositoryStats(db, nil)(rec, httptest.NewRequest("GET", "/repositories/stats?time=weekly", nil))
	if rec.Code != 200 {
		t.Fatal(rec.Code, rec.Body.String())
	}
	var out repositoryStatsResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if len(out.Repositories) != 1 {
		t.Fatal(out)
	}
	s := out.Repositories[0]
	if s.MergedPRs != 1 || s.OpenPRs != 1 || s.Contributors != 2 || s.LastMergedPR == nil || s.LastMergedPR.ID != "new" {
		t.Fatal(s)
	}
	rec = httptest.NewRecorder()
	HandleGetRepositoryStats(db, nil)(rec, httptest.NewRequest("GET", "/repositories/stats?time=invalid", nil))
	if rec.Code != 400 {
		t.Fatal(rec.Code)
	}
}
