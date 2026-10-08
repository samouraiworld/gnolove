package ai

import (
	"github.com/samouraiworld/topofgnomes/server/models"
	"testing"
)

func TestHistoricalReportVisibilityPreservesStoredJSON(t *testing.T) {
	db := newTestDB(t)
	if err := db.AutoMigrate(&models.Repository{}); err != nil {
		t.Fatal(err)
	}
	t.Setenv("REPOSITORIES_CONFIG_PATH", "../../config/repositories.yaml")
	for _, repo := range []models.Repository{{ID: "gnoverse/gnopls", Listed: true, Public: true}, {ID: "org/private", Listed: true, Public: false}} {
		if err := db.Create(&repo).Error; err != nil {
			t.Fatal(err)
		}
	}
	if err := models.InstallPublicRepositoryFilter(db); err != nil {
		t.Fatal(err)
	}
	original := `{"projects":[{"project_name":"gnolang/gnopls","summary":"historical"},{"project_name":"org/private","summary":"private"},{"project_name":"gnolang/gnokey-mobile","summary":"unavailable"}]}`
	report := models.Report{Data: original}
	if err := db.Create(&report).Error; err != nil {
		t.Fatal(err)
	}
	data, err := unmarshalReportData(report)
	if err != nil {
		t.Fatal(err)
	}
	if err := filterPublicReport(db, data); err != nil {
		t.Fatal(err)
	}
	projects := data["projects"].([]interface{})
	if len(projects) != 1 || projects[0].(map[string]interface{})["project_name"] != "gnolang/gnopls" {
		t.Fatalf("visible projects %v", projects)
	}
	var stored models.Report
	if err := db.First(&stored, report.ID).Error; err != nil {
		t.Fatal(err)
	}
	if stored.Data != original {
		t.Fatal("historical JSON was modified")
	}
}
