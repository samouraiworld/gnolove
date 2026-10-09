package models

import (
	"bytes"
	"fmt"
	"gopkg.in/yaml.v3"
	"gorm.io/gorm"
	"os"
	"regexp"
	"strings"
)

var repositoryIDPattern = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9-]{0,99}/[A-Za-z0-9._-]{1,100}$`)

func LoadRepositoryRegistry(path string) ([]Repository, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read repository registry: %w", err)
	}
	var cfg struct {
		SchemaVersion int          `yaml:"schemaVersion"`
		Repositories  []Repository `yaml:"repositories"`
	}
	decoder := yaml.NewDecoder(bytes.NewReader(raw))
	decoder.KnownFields(true)
	if err := decoder.Decode(&cfg); err != nil {
		return nil, fmt.Errorf("parse repository registry: %w", err)
	}
	if cfg.SchemaVersion != 1 || len(cfg.Repositories) == 0 {
		return nil, fmt.Errorf("repository registry: expected version 1 and nonempty repositories")
	}
	seen := map[string]bool{}
	for i := range cfg.Repositories {
		r := &cfg.Repositories[i]
		if !repositoryIDPattern.MatchString(r.ID) || r.BaseBranch == "" || strings.TrimSpace(r.BaseBranch) != r.BaseBranch {
			return nil, fmt.Errorf("invalid repository %q or branch", r.ID)
		}
		switch r.Category {
		case "core", "samourai", "gnoverse", "onbloc", "partner", "community":
		default:
			return nil, fmt.Errorf("invalid category for %s", r.ID)
		}
		switch r.Status {
		case "active", "inactive", "unavailable":
		default:
			return nil, fmt.Errorf("invalid status for %s", r.ID)
		}
		parts := strings.Split(r.ID, "/")
		r.Owner, r.Name = parts[0], parts[1]
		r.Listed = true
		for _, id := range append([]string{r.ID}, r.Aliases...) {
			key := strings.ToLower(id)
			if !repositoryIDPattern.MatchString(id) || seen[key] {
				return nil, fmt.Errorf("duplicate or invalid repository/alias %q", id)
			}
			seen[key] = true
		}
	}
	return cfg.Repositories, nil
}

// ReconcileRepositories preserves the stored metadata/checkpoints and rewrites
// alias references atomically. Rows outside the registry are retained, unlisted.
func ReconcileRepositories(db *gorm.DB, repos []Repository) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&Repository{}).Where("1 = 1").Update("listed", false).Error; err != nil {
			return err
		}
		for _, r := range repos {
			for _, alias := range r.Aliases {
				for _, table := range []string{"commits", "reviews", "pull_requests", "issues", "milestones"} {
					if err := tx.Table(table).Where("repository_id = ?", alias).Update("repository_id", r.ID).Error; err != nil {
						return err
					}
				}
				if err := tx.Model(&NotablePR{}).Where("repository = ?", alias).Update("repository", r.ID).Error; err != nil {
					return err
				}
			}
			var stored Repository
			if err := tx.Where("id = ?", r.ID).FirstOrCreate(&stored, Repository{ID: r.ID}).Error; err != nil {
				return err
			}
			fields := map[string]interface{}{"name": r.Name, "owner": r.Owner, "base_branch": r.BaseBranch, "category": r.Category, "description": r.Description, "status": r.Status, "listed": true}
			// Visibility must be attested again after every restart before serving data.
			fields["public"] = false
			if err := tx.Model(&Repository{}).Where("id = ?", r.ID).Updates(fields).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
