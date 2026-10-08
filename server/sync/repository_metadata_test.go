package sync

import (
	"context"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/shurcooL/githubv4"
	"go.uber.org/zap"
	"io"
	"net/http"
	"strings"
	"testing"
)

type metadataTransport struct {
	body  string
	calls int
}

func (m *metadataTransport) RoundTrip(*http.Request) (*http.Response, error) {
	m.calls++
	return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(m.body)), Header: make(http.Header)}, nil
}

func TestPrivateRepositoryStopsBeforeIngestion(t *testing.T) {
	db := newTestDB(t)
	if err := db.AutoMigrate(&models.Repository{}); err != nil {
		t.Fatal(err)
	}
	repo := models.Repository{ID: "org/project", Name: "project", Owner: "org", BaseBranch: "main", Public: true, Listed: true, Status: "active"}
	db.Create(&repo)
	transport := &metadataTransport{body: `{"data":{"repository":{"nameWithOwner":"org/project","isPrivate":true,"isArchived":false,"description":"secret","stargazerCount":1,"primaryLanguage":null,"pushedAt":null,"defaultBranchRef":{"name":"main"}}}}`}
	cleared := 0
	s := &Syncer{db: db, client: githubv4.NewClient(&http.Client{Transport: transport}), logger: zap.NewNop().Sugar(), invalidatePublicCache: func() { cleared++ }}
	s.syncOneRepo(context.Background(), repo, 0)
	if transport.calls != 1 {
		t.Fatal("private repo ingestion continued", transport.calls)
	}
	db.First(&repo, "id = ?", repo.ID)
	if repo.Public || repo.Status != "private" || cleared == 0 {
		t.Fatal(repo, cleared)
	}
}

func TestMetadataRequiresCanonicalNameAndBranch(t *testing.T) {
	for _, tc := range []struct{ name, canonical, branch string }{{"rename", "elsewhere/project", "main"}, {"branch", "org/project", "develop"}} {
		t.Run(tc.name, func(t *testing.T) {
			db := newTestDB(t)
			db.AutoMigrate(&models.Repository{})
			repo := models.Repository{ID: "org/project", Owner: "org", Name: "project", BaseBranch: "main", Listed: true}
			db.Create(&repo)
			body := `{"data":{"repository":{"nameWithOwner":"` + tc.canonical + `","isPrivate":false,"isArchived":false,"description":"public","stargazerCount":1,"primaryLanguage":null,"pushedAt":null,"defaultBranchRef":{"name":"` + tc.branch + `"}}}}`
			transport := &metadataTransport{body: body}
			s := &Syncer{db: db, client: githubv4.NewClient(&http.Client{Transport: transport})}
			if err := s.syncRepositoryMetadata(context.Background(), repo); err == nil {
				t.Fatal("accepted unexpected rename/branch")
			}
			db.First(&repo, "id = ?", repo.ID)
			if repo.Public {
				t.Fatal("unattested metadata exposed")
			}
		})
	}
}

func TestBoardItemsRequirePublicRegistryAndCurrentVisibility(t *testing.T) {
	db := newTestDB(t)
	if err := db.AutoMigrate(&models.Repository{}); err != nil {
		t.Fatal(err)
	}
	for _, r := range []models.Repository{{ID: "org/public", Listed: true, Public: true}, {ID: "org/removed", Public: true}} {
		db.Create(&r)
	}
	cleared := 0
	s := &Syncer{db: db, invalidatePublicCache: func() { cleared++ }}
	for _, id := range []string{"org/unknown", "org/removed"} {
		visible, err := s.publicBoardRepository(id, false)
		if err != nil || visible {
			t.Fatalf("board accepted %s: %v", id, err)
		}
	}
	if visible, err := s.publicBoardRepository("org/public", false); err != nil || !visible {
		t.Fatalf("public item excluded: %v", err)
	}
	if visible, err := s.publicBoardRepository("org/public", true); err != nil || visible {
		t.Fatalf("private item accepted: %v", err)
	}
	if visible, err := s.publicBoardRepository("org/public", false); err != nil || visible || cleared != 1 {
		t.Fatal("private history remained visible", err, cleared)
	}
}
