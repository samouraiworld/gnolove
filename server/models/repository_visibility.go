package models

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const publicFilterName = "gnolove:public_repositories"
const PublicRepositorySQL = "repository_id IN (SELECT id FROM repositories WHERE listed = 1 AND public = 1)"

// InstallPublicRepositoryFilter applies to reads, including preloads and counts.
// Writes retain historical rows; explicit raw SQL consumers use the same predicate.
func InstallPublicRepositoryFilter(db *gorm.DB) error {
	filter := func(tx *gorm.DB) {
		if tx.Statement.SQL.Len() != 0 {
			return
		}
		column := "repository_id"
		switch tx.Statement.Table {
		case "commits", "reviews", "pull_requests", "issues", "milestones":
		case "notable_prs":
			column = "repository"
		default:
			return
		}
		tx.Statement.AddClause(clause.Where{Exprs: []clause.Expression{clause.Expr{SQL: "? IN (SELECT id FROM repositories WHERE listed = 1 AND public = 1)", Vars: []interface{}{clause.Column{Table: clause.CurrentTable, Name: column}}}}})
	}
	if err := db.Callback().Query().Before("gorm:query").Register(publicFilterName, filter); err != nil {
		return err
	}
	return db.Callback().Row().Before("gorm:row").Register(publicFilterName, filter)
}

func RepositoryVisibilityPredicate(db *gorm.DB) string {
	if db.Callback().Query().Get(publicFilterName) == nil {
		return "1 = 1"
	}
	return PublicRepositorySQL
}

func PublicRepositories(db *gorm.DB) ([]Repository, error) {
	repos := []Repository{}
	err := db.Where("listed = ? AND public = ?", true, true).Order("id").Find(&repos).Error
	return repos, err
}
