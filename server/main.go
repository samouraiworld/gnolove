package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/samouraiworld/topofgnomes/server/db"
	"github.com/samouraiworld/topofgnomes/server/handler"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/signer"
	"github.com/samouraiworld/topofgnomes/server/sync"
	"github.com/subosito/gotenv"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var database *gorm.DB

const port = 3333

func main() {
	gotenv.Load()

	logger, err := zap.NewDevelopment()
	if err != nil {
		panic(err)
	}

	repositories, err := models.GetRepositoriesFromConfig()
	if err != nil {
		panic(err)
	}

	database, err = db.InitDB()
	if err != nil {
		log.Fatal(err)
	}
	if os.Getenv("OAUTH_CLIENT_ID") == "" {
		panic("OAUTH_CLIENT_ID is not set")
	}
	if os.Getenv("OAUTH_CLIENT_SECRET") == "" {
		panic("OAUTH_CLIENT_SECRET is not set")
	}

	signer := signer.New(database, logger.Sugar(), os.Getenv("MNEMONIC"), os.Getenv("CHAIN_ID"), os.Getenv("RPC_ADDR"), os.Getenv("REALM_PATH"))

	syncer := sync.NewSyncer(database, repositories, logger.Sugar())
	err = syncer.StartSynchonizing()
	if err != nil {
		panic(err)
	}

	http.HandleFunc("/getRepositories", handler.HandleGetRepository(database))
	http.HandleFunc("/getStats", handler.HandleGetUserStats(database))
	http.HandleFunc("/getIssues", handler.GetIssues(database))
	http.HandleFunc("/milestones/{number}", handler.GetMilestone(database))
	http.HandleFunc("/contributors/newest", handler.HandleGetNewestContributors(database))
	http.HandleFunc("/ghtoken", handler.HandleGithubCallback(signer))

	logger.Sugar().Infof("Server running on port %d", port)
	err = http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		panic(err)
	}
}
