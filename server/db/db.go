package db

import (
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitDB() (*gorm.DB, error) {
	var err error
	db, err := gorm.Open(sqlite.Open("db/database.db"), &gorm.Config{
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
	)
	if err != nil {
		panic(err)
	}

	return db, nil
}
