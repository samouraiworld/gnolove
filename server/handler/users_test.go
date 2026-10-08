package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestHandleGetUser(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	if err := db.Create(&models.User{ID: "u-1", Login: "alice", Wallet: "g1known"}).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /users/{address}", HandleGetUser(db))

	get := func(address string) *httptest.ResponseRecorder {
		rr := httptest.NewRecorder()
		mux.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/users/"+address, nil))
		return rr
	}

	if rr := get("g1known"); rr.Code != http.StatusOK || !strings.Contains(rr.Body.String(), `"alice"`) {
		t.Fatalf("known wallet: got %d %s", rr.Code, rr.Body.String())
	}
	if rr := get("g1unknown"); rr.Code != http.StatusNotFound || rr.Body.String() != "record not found" {
		t.Fatalf(`unknown wallet: want 404 "record not found", got %d %q`, rr.Code, rr.Body.String())
	}

	sqlDB, _ := db.DB()
	sqlDB.Close()
	if rr := get("g1known"); rr.Code != http.StatusInternalServerError {
		t.Fatalf("database down: want 500, got %d", rr.Code)
	}
}
