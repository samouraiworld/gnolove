package topics

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeYAML(t *testing.T, body string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "topics.yaml")
	if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
		t.Fatalf("write yaml: %v", err)
	}
	return path
}

const validYAML = `
schemaVersion: 1
topics:
  - slug: wallet
    label: Wallet
    patterns: ['adena', '\bwallet\b']
  - slug: indexer
    label: Indexer & API
    patterns: ['gnoscan', '\bindexer\b']
`

func TestLoadValidYAML(t *testing.T) {
	cfg, err := Load(writeYAML(t, validYAML))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if cfg.SchemaVersion != 1 {
		t.Fatalf("schemaVersion = %d, want 1", cfg.SchemaVersion)
	}
	if len(cfg.Topics) != 2 {
		t.Fatalf("topics = %d, want 2", len(cfg.Topics))
	}
	if cfg.LastSyncedAt.IsZero() {
		t.Fatal("LastSyncedAt must be the file mtime, got zero")
	}
	if cfg.Topics[0].Slug != "wallet" {
		t.Fatalf("first topic slug = %q, want wallet", cfg.Topics[0].Slug)
	}
}

func TestRejectWrongSchemaVersion(t *testing.T) {
	yaml := `
schemaVersion: 99
topics:
  - {slug: wallet, label: Wallet, patterns: ['x']}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "schemaVersion") {
		t.Fatalf("want schemaVersion error, got %v", err)
	}
}

func TestRejectEmptyTopics(t *testing.T) {
	yaml := `
schemaVersion: 1
topics: []
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "empty") {
		t.Fatalf("want empty-topics error, got %v", err)
	}
}

func TestRejectDuplicateSlugCaseInsensitive(t *testing.T) {
	yaml := `
schemaVersion: 1
topics:
  - {slug: Wallet, label: A, patterns: ['x']}
  - {slug: wallet, label: B, patterns: ['y']}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "duplicate slug") {
		t.Fatalf("want duplicate-slug error, got %v", err)
	}
}

func TestRejectDuplicateLabelCaseInsensitive(t *testing.T) {
	yaml := `
schemaVersion: 1
topics:
  - {slug: a, label: Wallet, patterns: ['x']}
  - {slug: b, label: wallet, patterns: ['y']}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "duplicate label") {
		t.Fatalf("want duplicate-label error, got %v", err)
	}
}

func TestRejectReservedOtherSlug(t *testing.T) {
	yaml := `
schemaVersion: 1
topics:
  - {slug: other, label: Other, patterns: ['x']}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "reserved") {
		t.Fatalf("want reserved-slug error, got %v", err)
	}
}

func TestRejectInvalidRegex(t *testing.T) {
	yaml := `
schemaVersion: 1
topics:
  - {slug: a, label: A, patterns: ['[unclosed']}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "regex") {
		t.Fatalf("want invalid-regex error, got %v", err)
	}
}

func TestRejectEmptyPatterns(t *testing.T) {
	yaml := `
schemaVersion: 1
topics:
  - {slug: a, label: A, patterns: []}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "patterns") {
		t.Fatalf("want empty-patterns error, got %v", err)
	}
}

func TestRejectWhitespaceInSlug(t *testing.T) {
	yaml := `
schemaVersion: 1
topics:
  - {slug: " wallet ", label: Wallet, patterns: ['x']}
`
	_, err := Load(writeYAML(t, yaml))
	if err == nil || !strings.Contains(err.Error(), "whitespace") {
		t.Fatalf("want whitespace error, got %v", err)
	}
}

func TestFindBySlugIsCaseInsensitive(t *testing.T) {
	cfg, err := Load(writeYAML(t, validYAML))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	tp, ok := cfg.FindBySlug("WALLET")
	if !ok {
		t.Fatal("FindBySlug must match case-insensitively")
	}
	if tp.Slug != "wallet" {
		t.Fatalf("got slug %q, want wallet", tp.Slug)
	}
	if _, ok := cfg.FindBySlug("missing"); ok {
		t.Fatal("FindBySlug should miss for unknown slug")
	}
}

func TestClassifyMatchesByRepoName(t *testing.T) {
	cfg, err := Load(writeYAML(t, validYAML))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	got := cfg.Classify("onbloc/adena-wallet", "any title")
	if got != "wallet" {
		t.Errorf("Classify(adena-wallet) = %q, want wallet", got)
	}
}

func TestClassifyMatchesByTitle(t *testing.T) {
	cfg, err := Load(writeYAML(t, validYAML))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	got := cfg.Classify("some/repo", "fix: indexer race")
	if got != "indexer" {
		t.Errorf("Classify(title=indexer) = %q, want indexer", got)
	}
}

func TestClassifyIsCaseInsensitive(t *testing.T) {
	cfg, err := Load(writeYAML(t, validYAML))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	got := cfg.Classify("Onbloc/Adena-Wallet", "X")
	if got != "wallet" {
		t.Errorf("Classify mixed-case = %q, want wallet", got)
	}
}

func TestClassifyFirstMatchWins(t *testing.T) {
	// wallet rule comes before indexer; a hit on both wins for wallet.
	cfg, err := Load(writeYAML(t, validYAML))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	got := cfg.Classify("onbloc/adena-wallet", "feat: indexer rewrite")
	if got != "wallet" {
		t.Errorf("Classify first-match = %q, want wallet", got)
	}
}

func TestClassifyFallsThroughToOther(t *testing.T) {
	cfg, err := Load(writeYAML(t, validYAML))
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	got := cfg.Classify("weirdorg/totallynew", "feat: random")
	if got != OtherSlug {
		t.Errorf("Classify unmatched = %q, want %q", got, OtherSlug)
	}
}

func TestLoadRealConfigFile(t *testing.T) {
	// Smoke test the actual checked-in config so a bad commit fails CI.
	cfg, err := Load("../config/topics.yaml")
	if err != nil {
		t.Fatalf("real topics.yaml: %v", err)
	}
	if len(cfg.Topics) < 10 {
		t.Fatalf("expected real config to have >=10 topics, got %d", len(cfg.Topics))
	}
	// Parity smoke: the gnolove/gno repo should classify as gnovm
	// (it's the canonical first-rule-wins case from the legacy TS).
	if got := cfg.Classify("gnoland/gno", "feat: core consensus tweak"); got != "gnovm" {
		t.Errorf("gnoland/gno + core title => %q, want gnovm", got)
	}
	// adena-wallet should pick wallet, not security (auth pattern).
	if got := cfg.Classify("onbloc/adena-wallet", "x"); got != "wallet" {
		t.Errorf("adena-wallet => %q, want wallet", got)
	}
	// gnoscan should pick indexer, not other.
	if got := cfg.Classify("onbloc/gnoscan", "x"); got != "indexer" {
		t.Errorf("gnoscan => %q, want indexer", got)
	}
}
