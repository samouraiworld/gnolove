package topics

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/samouraiworld/topofgnomes/server/topics"
)

func fixtureConfig(t *testing.T) *topics.Config {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "topics.yaml")
	body := `
schemaVersion: 1
topics:
  - {slug: wallet,  label: Wallet,        patterns: ['adena', '\bwallet\b']}
  - {slug: indexer, label: Indexer & API, patterns: ['gnoscan', '\bindexer\b']}
`
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatalf("write fixture: %v", err)
	}
	cfg, err := topics.Load(path)
	if err != nil {
		t.Fatalf("load fixture: %v", err)
	}
	return cfg
}

func TestHandleGetAll_ReturnsTopicsWithSchemaAndSyncedAt(t *testing.T) {
	cfg := fixtureConfig(t)
	h := HandleGetAll(cfg)

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/topics", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d body=%s", rec.Code, rec.Body.String())
	}

	var body struct {
		SchemaVersion int            `json:"schemaVersion"`
		LastSyncedAt  time.Time      `json:"lastSyncedAt"`
		Topics        []topics.Topic `json:"topics"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.SchemaVersion != 1 {
		t.Errorf("schemaVersion = %d, want 1", body.SchemaVersion)
	}
	if body.LastSyncedAt.IsZero() {
		t.Error("lastSyncedAt missing")
	}
	if len(body.Topics) != 2 {
		t.Fatalf("topics len = %d, want 2", len(body.Topics))
	}
	if body.Topics[0].Slug != "wallet" {
		t.Errorf("topics[0].slug = %q, want wallet", body.Topics[0].Slug)
	}
	if len(body.Topics[0].Patterns) != 2 {
		t.Errorf("topics[0].patterns len = %d, want 2", len(body.Topics[0].Patterns))
	}
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", got)
	}
}

func TestHandleGetAll_PreservesYAMLOrder(t *testing.T) {
	// Order matters for first-match-wins classification on the frontend.
	cfg := fixtureConfig(t)
	h := HandleGetAll(cfg)

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/topics", nil))

	var body struct {
		Topics []topics.Topic `json:"topics"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.Topics[0].Slug != "wallet" || body.Topics[1].Slug != "indexer" {
		t.Errorf("order = [%s, %s], want [wallet, indexer]",
			body.Topics[0].Slug, body.Topics[1].Slug)
	}
}
