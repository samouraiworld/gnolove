package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/samouraiworld/topofgnomes/server/db"
	"github.com/samouraiworld/topofgnomes/server/handler"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/sync"
	"github.com/subosito/gotenv"
	"gorm.io/gorm"
)

var database *gorm.DB

const port = 3333

func main() {
	gotenv.Load()
	graphqlEndpoint := os.Getenv("GRAPHQL_ENDPOINT")
	repository := os.Getenv("REPOSITORY")
	owner := os.Getenv("OWNER")
	var err error
	database, err = db.InitDB()
	if err != nil {
		log.Fatal(err)
	}

	syncer := sync.NewSyncer(database, graphqlEndpoint, repository, owner)
	err = syncer.SyncUsers()
	if err != nil {
		log.Fatal(err)
	}

	err = syncer.SyncIssues()
	if err != nil {
		log.Fatal(err)
	}

	err = syncer.SyncPRs()
	if err != nil {
		log.Fatal(err)
	}

	http.HandleFunc("/getStats", handler.HandleGetUserStats(database))
	http.HandleFunc("/getIssues", getIssues)

	fmt.Printf("Server running on port %d", port)
	err = http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	if err != nil {
		panic(err)
	}
}

func getIssues(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var issues []models.Issue
	err := database.Model(&models.Issue{}).Limit(20).Find(&issues).Error
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))

		return
	}
	json.NewEncoder(w).Encode(issues)
}
