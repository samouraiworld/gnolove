package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/go-chi/chi/v5"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/samouraiworld/topofgnomes/server/db"
	"github.com/samouraiworld/topofgnomes/server/handler"
	"github.com/samouraiworld/topofgnomes/server/handler/contributor"
	infrarepo "github.com/samouraiworld/topofgnomes/server/infra/repository"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/signer"
	"github.com/samouraiworld/topofgnomes/server/sync"
	"github.com/subosito/gotenv"
	"go.uber.org/zap"
	"gorm.io/gorm"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
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
	if os.Getenv("GITHUB_OAUTH_CLIENT_ID") == "" {
		panic("GITHUB_OAUTH_CLIENT_ID is not set")
	}
	if os.Getenv("GITHUB_OAUTH_CLIENT_SECRET") == "" {
		panic("GITHUB_OAUTH_CLIENT_SECRET is not set")
	}

	signer := signer.New(
		database,
		logger,
		os.Getenv("GHVERIFY_OWNER_MNEMONIC"),
		os.Getenv("GNO_CHAIN_ID"),
		os.Getenv("GNO_RPC_ENDPOINT"),
		os.Getenv("GHVERIFY_REALM_PATH"),
		os.Getenv("GOVDAO_REALM_PATH"),
	)

	syncer := sync.NewSyncer(database, repositories, logger)

	// Start data synchronization first
	err = syncer.StartSynchonizing()
	if err != nil {
		panic(err)
	}

	// Start the Discord leaderboard cron job if webhook is configured
	if os.Getenv("DISCORD_WEBHOOK_URL") != "" {
		syncer.StartLeaderboardNotifier()
	} else {
		logger.Warn("DISCORD_WEBHOOK_URL not set, skipping leaderboard notifier")
	}

	// Start personal scheduler for per-user leaderboard configuration
	syncer.StartPersonalLeaderboardScheduler()

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

	// repositories
	prRepo := infrarepo.NewPullRequestRepository(database)

	router.HandleFunc("/repositories", handler.HandleGetRepository(database))
	router.HandleFunc("/stats", handler.HandleGetUserStats(database, cache))
	router.HandleFunc("/issues", handler.GetIssues(database))
	router.HandleFunc("/pull-requests/report", handler.GetPullrequestsReportByDate(prRepo))
	router.HandleFunc("/score-factors", handler.HandleGetScoreFactors)
	router.HandleFunc("/milestones/{number}", handler.GetMilestone(database))
	router.HandleFunc("/contributors/newest", handler.HandleGetNewestContributors(database))
	router.HandleFunc("/github/verify", handler.HandleVerifyGithubAccount(signer, database))
	router.HandleFunc("/github/oauth/exchange", handler.HandleGetGithubUserAndTokenByCode(signer, database))
	router.HandleFunc("/contributors/{login}", contributor.HandleGetContributor(database))
	router.Post("/github/link", handler.HandleLink(database))

	// Leaderboard configuration routes (per-user) - protected by Clerk
	router.Group(func(r chi.Router) {
		r.Use(clerkhttp.WithHeaderAuthorization())
		r.Get("/leaderboard/configs", handler.HandleGetLeaderboardConfigs(database))
		r.Post("/leaderboard/configs", handler.HandleCreateLeaderboardConfig(database))
		r.Put("/leaderboard/configs/{id}", handler.HandleUpdateLeaderboardConfigByID(database))
		r.Delete("/leaderboard/configs/{id}", handler.HandleDeleteLeaderboardConfig(database))
	})

	// Onchain package contributions endpoints
	router.HandleFunc("/onchain/packages", handler.HandleGetAllPackages(database))
	router.HandleFunc("/onchain/packages/{address}", handler.HandleGetPackagesByUser(database))

	// Onchain namespace contributions endpoints
	router.HandleFunc("/onchain/namespaces", handler.HandleGetAllNamespaces(database))
	router.HandleFunc("/onchain/namespaces/{address}", handler.HandleGetNamespacesByUser(database))
	router.HandleFunc("/onchain/proposals", handler.HandleGetAllProposals(database))

	logger.Infof("Server running on port %d", port)
	err = http.ListenAndServe(fmt.Sprintf(":%d", port), router)
	if err != nil {
		panic(err)
	}
}

func Compress() func(next http.Handler) http.Handler {
	return middleware.Compress(5)
}
