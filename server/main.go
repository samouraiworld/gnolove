package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/go-chi/chi/v5"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/samouraiworld/topofgnomes/server/db"
	"github.com/samouraiworld/topofgnomes/server/handler"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/sync"
	"github.com/subosito/gotenv"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var database *gorm.DB

const port = 3333

var logger *zap.SugaredLogger

// LoggingMiddleware logs the duration of each request
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		duration := time.Since(start)
		logger.Infof("[%s] %s %s took %s", time.Now().Format("2006-01-02 15:04:05"), r.Method, r.URL.Path, duration)
	})
}

func main() {
	gotenv.Load()
	zapLogger, err := zap.NewDevelopment()
	if err != nil {
		panic(err)
	}

	logger = zapLogger.Sugar()

	repositories, err := models.GetRepositoriesFromConfig()
	if err != nil {
		panic(err)
	}

	database, err = db.InitDB()
	if err != nil {
		log.Fatal(err)
	}

	syncer := sync.NewSyncer(database, repositories, logger)
	err = syncer.StartSynchonizing()
	if err != nil {
		panic(err)
	}

	cache, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: 100000,    // number of keys to track frequency of (10M).
		MaxCost:     100000000, // maximum cost of cache (1GB).
		BufferItems: 64,        // number of keys per Get buffer.
	})
	if err != nil {
		panic(err)
	}
	router := chi.NewRouter()
	router.Use(LoggingMiddleware)
	router.Use(Compress())
	router.HandleFunc("/getRepositories", handler.HandleGetRepository(database))
	router.HandleFunc("/getStats", handler.HandleGetUserStats(database, cache))
	router.HandleFunc("/getIssues", handler.GetIssues(database))
	router.HandleFunc("/milestones/{number}", handler.GetMilestone(database))
	router.HandleFunc("/contributors/newest", handler.HandleGetNewestContributors(database))

	logger.Infof("Server running on port %d", port)
	err = http.ListenAndServe(fmt.Sprintf(":%d", port), router)
	if err != nil {
		panic(err)
	}
}

func Compress() func(next http.Handler) http.Handler {
	return middleware.Compress(5)
}
