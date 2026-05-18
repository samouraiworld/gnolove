package models

import (
	"fmt"
	"os"
	"strings"
)

type Repository struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Owner      string `json:"owner"`
	BaseBranch string `json:"baseBranch"`
}

// GetRepositoriesFromConfig parses GITHUB_REPOSITORIES from the environment.
// Format: each repo is `owner/name/branch`. Repos can be separated by spaces,
// commas, or newlines (mix-and-match supported). Blank entries are skipped.
func GetRepositoriesFromConfig() ([]Repository, error) {
	return ParseRepositoriesConfig(os.Getenv("GITHUB_REPOSITORIES"))
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
