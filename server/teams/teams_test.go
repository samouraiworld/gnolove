package teams

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeYAML(t *testing.T, body string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "teams.yaml")
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatalf("write yaml: %v", err)
	}
	return path
}

const validYAML = `
schemaVersion: 1
teams:
  - slug: onbloc
    name: Onbloc
    color: purple
    members: [notJoon, r3v4s]
  - slug: samouraiworld
    name: Samourai.world
    color: red
    members: [n0izn0iz, zxxma]
`

func TestLoadValidYAML(t *testing.T) {
	cfg, err := Load(writeYAML(t, validYAML))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.SchemaVersion != 1 {
		t.Fatalf("schemaVersion = %d, want 1", cfg.SchemaVersion)
	}
	if len(cfg.Teams) != 2 {
		t.Fatalf("teams = %d, want 2", len(cfg.Teams))
	}
	if cfg.LastSyncedAt.IsZero() {
		t.Fatal("LastSyncedAt must be the file mtime, got zero")
	}
	if cfg.Teams[0].Slug != "onbloc" {
		t.Fatalf("first team slug = %q, want onbloc", cfg.Teams[0].Slug)
	}
}

func TestRejectDuplicateSlugCaseInsensitive(t *testing.T) {
	yaml := `
schemaVersion: 1
teams:
  - {slug: Onbloc, name: A, color: purple, members: [x]}
  - {slug: onbloc, name: B, color: red,    members: [y]}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "duplicate slug") {
		t.Fatalf("want duplicate-slug error, got %v", err)
	}
}

func TestRejectDuplicateNameCaseInsensitive(t *testing.T) {
	yaml := `
schemaVersion: 1
teams:
  - {slug: a, name: onbloc, color: purple, members: [x]}
  - {slug: b, name: Onbloc, color: red,    members: [y]}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "duplicate name") {
		t.Fatalf("want duplicate-name error, got %v", err)
	}
}

func TestRejectDoubleAttributionCaseInsensitive(t *testing.T) {
	yaml := `
schemaVersion: 1
teams:
  - {slug: a, name: A, color: purple, members: [Alice, bob]}
  - {slug: b, name: B, color: red,    members: [ALICE]}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "double-attributed") {
		t.Fatalf("want double-attribution error, got %v", err)
	}
}

func TestRejectInvalidColor(t *testing.T) {
	yaml := `
schemaVersion: 1
teams:
  - {slug: a, name: A, color: chartreuse, members: [x]}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "invalid color") {
		t.Fatalf("want invalid-color error, got %v", err)
	}
}

func TestRejectWhitespaceInSlug(t *testing.T) {
	yaml := `
schemaVersion: 1
teams:
  - {slug: " onbloc ", name: Onbloc, color: purple, members: [x]}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "whitespace") {
		t.Fatalf("want whitespace error, got %v", err)
	}
}

func TestRejectEmptyMembers(t *testing.T) {
	yaml := `
schemaVersion: 1
teams:
  - {slug: a, name: A, color: purple, members: []}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "members") {
		t.Fatalf("want empty-members error, got %v", err)
	}
}

func TestFindBySlugIsCaseInsensitive(t *testing.T) {
	cfg, err := Load(writeYAML(t, validYAML))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	team, ok := cfg.FindBySlug("ONBLOC")
	if !ok {
		t.Fatal("FindBySlug must match case-insensitively")
	}
	if team.Slug != "onbloc" {
		t.Fatalf("got slug %q, want onbloc", team.Slug)
	}
	if _, ok := cfg.FindBySlug("missing"); ok {
		t.Fatal("FindBySlug should miss for unknown slug")
	}
}

func TestLoadRealConfigFile(t *testing.T) {
	// Smoke test the actual checked-in config so a bad commit fails CI.
	cfg, err := Load("../config/teams.yaml")
	if err != nil {
		t.Fatalf("real teams.yaml: %v", err)
	}
	if len(cfg.Teams) < 2 {
		t.Fatalf("expected real config to have multiple teams, got %d", len(cfg.Teams))
	}
}
