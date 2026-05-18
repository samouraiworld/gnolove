// Package teams loads and validates the gnolove team roster from a YAML
// config file. The roster is the source of truth for which GitHub login
// belongs to which team and powers the /teams and /teams/:slug endpoints.
package teams

import (
	"fmt"
	"os"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// SchemaVersion is the YAML shape this loader understands.
const SchemaVersion = 1

// validColors mirrors the TeamColor union used by the Memba frontend.
var validColors = map[string]struct{}{
	"blue": {}, "yellow": {}, "purple": {}, "red": {},
	"green": {}, "brown": {}, "pink": {},
}

type Team struct {
	Slug        string   `yaml:"slug" json:"slug"`
	Name        string   `yaml:"name" json:"name"`
	Color       string   `yaml:"color" json:"color"`
	Description string   `yaml:"description,omitempty" json:"description,omitempty"`
	Members     []string `yaml:"members" json:"members"`
}

// Config is the parsed teams.yaml plus the file mtime, surfaced to the
// frontend as `lastSyncedAt` so the "Last sync:" pill stays honest.
type Config struct {
	SchemaVersion int       `yaml:"schemaVersion" json:"schemaVersion"`
	Teams         []Team    `yaml:"teams"          json:"teams"`
	LastSyncedAt  time.Time `yaml:"-"              json:"lastSyncedAt"`
}

func Load(path string) (*Config, error) {
	info, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("stat %s: %w", path, err)
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read %s: %w", path, err)
	}
	var cfg Config
	if err := yaml.Unmarshal(raw, &cfg); err != nil {
		return nil, fmt.Errorf("parse %s: %w", path, err)
	}
	if cfg.SchemaVersion != SchemaVersion {
		return nil, fmt.Errorf("schemaVersion = %d, want %d", cfg.SchemaVersion, SchemaVersion)
	}
	if err := validate(cfg.Teams); err != nil {
		return nil, err
	}
	cfg.LastSyncedAt = info.ModTime().UTC()
	return &cfg, nil
}

func (c *Config) FindBySlug(slug string) (Team, bool) {
	want := strings.ToLower(slug)
	for _, t := range c.Teams {
		if strings.ToLower(t.Slug) == want {
			return t, true
		}
	}
	return Team{}, false
}

// MembersOf returns the case-preserved member list for a slug, or nil.
// Convenience for callers that only need the member set.
func (c *Config) MembersOf(slug string) []string {
	t, ok := c.FindBySlug(slug)
	if !ok {
		return nil
	}
	return t.Members
}

func validate(teams []Team) error {
	if len(teams) == 0 {
		return fmt.Errorf("teams: empty roster")
	}
	seenSlug := map[string]string{}  // lower -> original
	seenName := map[string]string{}  // lower -> original
	memberTeam := map[string]string{} // lower -> slug
	for _, t := range teams {
		if err := checkWhitespace("slug", t.Slug); err != nil {
			return err
		}
		if err := checkWhitespace("name", t.Name); err != nil {
			return err
		}
		if t.Slug == "" {
			return fmt.Errorf("team has empty slug")
		}
		if t.Name == "" {
			return fmt.Errorf("team %q: empty name", t.Slug)
		}
		if _, ok := validColors[t.Color]; !ok {
			return fmt.Errorf("team %q: invalid color %q", t.Slug, t.Color)
		}
		if len(t.Members) == 0 {
			return fmt.Errorf("team %q: members must be non-empty", t.Slug)
		}
		slugKey := strings.ToLower(t.Slug)
		if prev, ok := seenSlug[slugKey]; ok {
			return fmt.Errorf("duplicate slug %q (also seen as %q)", t.Slug, prev)
		}
		seenSlug[slugKey] = t.Slug
		nameKey := strings.ToLower(t.Name)
		if prev, ok := seenName[nameKey]; ok {
			return fmt.Errorf("duplicate name %q (also seen as %q)", t.Name, prev)
		}
		seenName[nameKey] = t.Name
		for _, m := range t.Members {
			if err := checkWhitespace("member", m); err != nil {
				return fmt.Errorf("team %q: %w", t.Slug, err)
			}
			if m == "" {
				return fmt.Errorf("team %q: empty member entry", t.Slug)
			}
			key := strings.ToLower(m)
			if otherSlug, ok := memberTeam[key]; ok && otherSlug != t.Slug {
				return fmt.Errorf("contributor %q double-attributed (in %q and %q)", m, otherSlug, t.Slug)
			}
			memberTeam[key] = t.Slug
		}
	}
	return nil
}

func checkWhitespace(field, val string) error {
	if val != strings.TrimSpace(val) {
		return fmt.Errorf("%s %q has leading/trailing whitespace", field, val)
	}
	return nil
}
