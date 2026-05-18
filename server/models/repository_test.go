package models

import (
	"strings"
	"testing"
)

func TestParseRepositoriesConfig_SpaceSeparated(t *testing.T) {
	got, err := ParseRepositoriesConfig("gnolang/gno/master onbloc/gnoscan/main")
	if err != nil {
		t.Fatalf("ParseRepositoriesConfig: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("got %d repos, want 2", len(got))
	}
	if got[0].ID != "gnolang/gno" || got[0].BaseBranch != "master" {
		t.Errorf("first repo = %+v", got[0])
	}
	if got[1].ID != "onbloc/gnoscan" || got[1].BaseBranch != "main" {
		t.Errorf("second repo = %+v", got[1])
	}
}

func TestParseRepositoriesConfig_CommaSeparated(t *testing.T) {
	got, err := ParseRepositoriesConfig("gnolang/gno/master,onbloc/gnoscan/main")
	if err != nil {
		t.Fatalf("ParseRepositoriesConfig: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("got %d repos, want 2", len(got))
	}
}

func TestParseRepositoriesConfig_NewlineSeparated(t *testing.T) {
	got, err := ParseRepositoriesConfig("gnolang/gno/master\nonbloc/gnoscan/main\n")
	if err != nil {
		t.Fatalf("ParseRepositoriesConfig: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("got %d repos, want 2", len(got))
	}
}

func TestParseRepositoriesConfig_MixedSeparators(t *testing.T) {
	got, err := ParseRepositoriesConfig("gnolang/gno/master, onbloc/gnoscan/main\nsamouraiworld/gnolove/main")
	if err != nil {
		t.Fatalf("ParseRepositoriesConfig: %v", err)
	}
	if len(got) != 3 {
		t.Fatalf("got %d repos (%v), want 3", len(got), got)
	}
}

func TestParseRepositoriesConfig_IgnoresBlankEntries(t *testing.T) {
	// Trailing comma, doubled commas, surrounding whitespace.
	got, err := ParseRepositoriesConfig("  gnolang/gno/master ,, , onbloc/gnoscan/main,\n\n")
	if err != nil {
		t.Fatalf("ParseRepositoriesConfig: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("got %d repos, want 2", len(got))
	}
}

func TestParseRepositoriesConfig_ErrorIncludesPositionAndEntry(t *testing.T) {
	_, err := ParseRepositoriesConfig("gnolang/gno/master, broken-entry, onbloc/gnoscan/main")
	if err == nil {
		t.Fatal("want parse error, got nil")
	}
	if !strings.Contains(err.Error(), "broken-entry") {
		t.Errorf("error missing entry context: %v", err)
	}
	if !strings.Contains(err.Error(), "entry 2") {
		t.Errorf("error missing entry index: %v", err)
	}
}

func TestParseRepositoriesConfig_RejectsEmptyConfig(t *testing.T) {
	if _, err := ParseRepositoriesConfig(""); err == nil {
		t.Error("empty config should error")
	}
	if _, err := ParseRepositoriesConfig("   \n  ,, "); err == nil {
		t.Error("whitespace-only config should error")
	}
}

func TestParseRepositoriesConfig_RejectsEmptyComponents(t *testing.T) {
	cases := []string{
		"/gno/master",       // empty owner
		"gnolang//master",   // empty name
		"gnolang/gno/",      // empty branch
		"gnolang/gno",       // only two segments
		"gnolang/gno/a/b",   // too many segments
	}
	for _, c := range cases {
		if _, err := ParseRepositoriesConfig(c); err == nil {
			t.Errorf("ParseRepositoriesConfig(%q) should error", c)
		}
	}
}
