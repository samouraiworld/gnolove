// Package topics loads and validates the gnolove Focus Areas taxonomy from a
// YAML config file. The taxonomy is the source of truth for which PR/repo
// patterns map to which topic slug and powers the /topics endpoint plus the
// server-side classifier used by AI prompts in future phases.
//
// Frontend mirror: Memba/frontend/src/lib/gnoloveFocusAreas.ts (Phase 2c
// switches it from a hardcoded copy to a seed-union over GET /topics).
package topics

import (
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

// SchemaVersion is the YAML shape this loader understands.
const SchemaVersion = 1

// OtherSlug is the fallback bucket the classifier returns when no rule
// matches. It's reserved at the YAML level — config cannot declare a topic
// with this slug — because consumers treat it as a special case (hidden
// unless it represents > 5% of the team's signal).
const OtherSlug = "other"

type Topic struct {
	Slug     string   `yaml:"slug"     json:"slug"`
	Label    string   `yaml:"label"    json:"label"`
	Patterns []string `yaml:"patterns" json:"patterns"`
}

// Config is the parsed topics.yaml plus compiled regexes and the file mtime
// (surfaced to the frontend as `lastSyncedAt` so the cache key in
// `useGnoloveTopics` bumps when ops re-deploys the taxonomy).
type Config struct {
	SchemaVersion int       `yaml:"schemaVersion" json:"schemaVersion"`
	Topics        []Topic   `yaml:"topics"        json:"topics"`
	LastSyncedAt  time.Time `yaml:"-"             json:"lastSyncedAt"`

	// compiled[i] is the regex set for Topics[i], in declaration order.
	// Kept off the wire — clients receive raw pattern strings and compile
	// them in JS (or use them as-is in their own classifier).
	compiled [][]*regexp.Regexp
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
	compiled, err := validate(cfg.Topics)
	if err != nil {
		return nil, err
	}
	cfg.compiled = compiled
	cfg.LastSyncedAt = info.ModTime().UTC()
	return &cfg, nil
}

// FindBySlug returns the topic for the given slug (case-insensitive).
func (c *Config) FindBySlug(slug string) (Topic, bool) {
	want := strings.ToLower(slug)
	for _, t := range c.Topics {
		if strings.ToLower(t.Slug) == want {
			return t, true
		}
	}
	return Topic{}, false
}

// Classify returns the slug of the first matching topic for the given
// `(repo, title)` pair, or [OtherSlug] when none match. Matching is done
// against a lowercased `${repo} ${title}` haystack — keep YAML patterns
// lowercase (or case-fold via `(?i)`) accordingly.
func (c *Config) Classify(repo, title string) string {
	haystack := strings.ToLower(repo + " " + title)
	for i, t := range c.Topics {
		for _, re := range c.compiled[i] {
			if re.MatchString(haystack) {
				return t.Slug
			}
		}
	}
	return OtherSlug
}

func validate(topics []Topic) ([][]*regexp.Regexp, error) {
	if len(topics) == 0 {
		return nil, fmt.Errorf("topics: empty taxonomy")
	}
	seenSlug := map[string]string{}  // lower -> original
	seenLabel := map[string]string{} // lower -> original
	compiled := make([][]*regexp.Regexp, len(topics))
	for i, t := range topics {
		if err := checkWhitespace("slug", t.Slug); err != nil {
			return nil, err
		}
		if err := checkWhitespace("label", t.Label); err != nil {
			return nil, err
		}
		if t.Slug == "" {
			return nil, fmt.Errorf("topic has empty slug")
		}
		if t.Label == "" {
			return nil, fmt.Errorf("topic %q: empty label", t.Slug)
		}
		if strings.EqualFold(t.Slug, OtherSlug) {
			return nil, fmt.Errorf("topic %q: slug %q is reserved for the unmatched bucket", t.Slug, OtherSlug)
		}
		slugKey := strings.ToLower(t.Slug)
		if prev, ok := seenSlug[slugKey]; ok {
			return nil, fmt.Errorf("duplicate slug %q (also seen as %q)", t.Slug, prev)
		}
		seenSlug[slugKey] = t.Slug

		labelKey := strings.ToLower(t.Label)
		if prev, ok := seenLabel[labelKey]; ok {
			return nil, fmt.Errorf("duplicate label %q (also seen as %q)", t.Label, prev)
		}
		seenLabel[labelKey] = t.Label

		if len(t.Patterns) == 0 {
			return nil, fmt.Errorf("topic %q: patterns must be non-empty", t.Slug)
		}
		compiled[i] = make([]*regexp.Regexp, len(t.Patterns))
		for j, p := range t.Patterns {
			if p == "" {
				return nil, fmt.Errorf("topic %q: empty pattern at index %d", t.Slug, j)
			}
			re, err := regexp.Compile(p)
			if err != nil {
				return nil, fmt.Errorf("topic %q: invalid regex %q: %w", t.Slug, p, err)
			}
			compiled[i][j] = re
		}
	}
	return compiled, nil
}

func checkWhitespace(field, val string) error {
	if val != strings.TrimSpace(val) {
		return fmt.Errorf("%s %q has leading/trailing whitespace", field, val)
	}
	return nil
}
