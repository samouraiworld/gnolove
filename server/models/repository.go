package models

import (
	"fmt"
	"os"
	"strings"
	"time"
)

type Repository struct {
	ID           string     `json:"id" yaml:"id" gorm:"primaryKey"`
	Name         string     `json:"name" yaml:"-"`
	Owner        string     `json:"owner" yaml:"-"`
	BaseBranch   string     `json:"baseBranch" yaml:"branch"`
	Category     string     `json:"category" yaml:"category"`
	Description  string     `json:"description" yaml:"description"`
	Status       string     `json:"status" yaml:"status"`
	Aliases      []string   `json:"-" yaml:"aliases,omitempty" gorm:"-"`
	Listed       bool       `json:"-" yaml:"-"`
	Public       bool       `json:"-" yaml:"-"`
	Stars        *int       `json:"stars" yaml:"-"`
	Language     string     `json:"language" yaml:"-"`
	PushedAt     *time.Time `json:"pushedAt" yaml:"-"`
	LastSyncedAt *time.Time `json:"lastSyncedAt" yaml:"-"`
	SyncError    string     `json:"syncError" yaml:"-"`
}

// The reviewed registry is authoritative, including when the legacy env is set.
func GetRepositoriesFromConfig() ([]Repository, error) {
	path := os.Getenv("REPOSITORIES_CONFIG_PATH")
	if path == "" {
		path = "config/repositories.yaml"
	}
	return LoadRepositoryRegistry(path)
}

// ParseRepositoriesConfig is the env-free core, exposed for tests.
//
// Tolerated separators: ' ', ',', '\n', '\t', '\r'. Entries are trimmed.
// Errors are returned with 1-based entry index and the offending string so
// a bad deploy is easy to debug from the gnolove server log.
func ParseRepositoriesConfig(cfg string) ([]Repository, error) {
	tokens := strings.FieldsFunc(cfg, func(r rune) bool {
		switch r {
		case ' ', ',', '\n', '\t', '\r':
			return true
		}
		return false
	})

	out := make([]Repository, 0, len(tokens))
	idx := 0
	for _, raw := range tokens {
		entry := strings.TrimSpace(raw)
		if entry == "" {
			continue
		}
		idx++
		parts := strings.Split(entry, "/")
		if len(parts) != 3 || parts[0] == "" || parts[1] == "" || parts[2] == "" {
			return nil, fmt.Errorf("invalid repository entry %d (%q): expected owner/name/branch", idx, entry)
		}
		out = append(out, Repository{
			ID:         parts[0] + "/" + parts[1],
			Name:       parts[1],
			Owner:      parts[0],
			BaseBranch: parts[2],
		})
	}

	if len(out) == 0 {
		return nil, fmt.Errorf("GITHUB_REPOSITORIES is empty or has no valid entries")
	}
	return out, nil
}
