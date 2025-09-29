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
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		fmt.Println("DB_PATH environment variable is not set, using default path")
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
		&models.GovDaoMember{},
	)
	if err != nil {
		panic(err)
	}

	return db, nil
}
