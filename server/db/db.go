package db

import (
	"fmt"
	"os"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitDB() (*gorm.DB, error) {
	var err error
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		fmt.Println("DATABASE_PATH environment variable is not set, using default path")
		dbPath = "db/database.db"
	}
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Commit{},
		&models.Review{},
		&models.PullRequest{},
		&models.Issue{},
		&models.Milestone{},
		&models.Repository{},
		&models.GnoNamespace{},
		&models.GnoPackage{},
		&models.GnoProposal{},
		&models.GnoVote{},
		&models.File{},
		&models.Report{},
		&models.GovDaoMember{},
		&models.LeaderboardWebhook{},
		&models.SyncStatus{},
		&models.NotablePR{},
	)
	if err != nil {
		panic(err)
	}

	// Backfill legacy reports written before the prompt_version column existed.
	// AutoMigrate creates the column with default=1 for new rows, but rows
	// written under the legacy schema land at 0 — flip those to 1 so the
	// frontend can rely on the version being present and meaningful.
	if err := db.Exec("UPDATE reports SET prompt_version = 1 WHERE prompt_version = 0").Error; err != nil {
		return nil, fmt.Errorf("backfill reports.prompt_version: %w", err)
	}

	// Backfill notable_prs rows written before the multi-board column existed —
	// they all came from the default board (#66). Avoids a transient empty
	// board before the first multi-board sync re-stamps them.
	if err := db.Exec("UPDATE notable_prs SET board_id = ? WHERE board_id = '' OR board_id IS NULL", models.DefaultBoardID).Error; err != nil {
		return nil, fmt.Errorf("backfill notable_prs.board_id: %w", err)
	}

	return db, nil
}
