package handler

import (
	"encoding/json"
	"net/http"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

// HandleGetBoards lists the mirrored gnolang project boards and their taxonomy
// (areas + status order), so the frontend builds its selector and per-board
// columns without hardcoding anything.
func HandleGetBoards() func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.BoardMetas())
	}
}

// HandleGetNotablePRs serves one mirrored board's items, most-recently-updated
// first. The board is selected by ?board=<id> (default: models.DefaultBoardID,
// #66, for back-compat). Returns [] when the board is empty or the project sync
// has not run / lacks the read:project token scope.
func HandleGetNotablePRs(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		boardID := r.URL.Query().Get("board")
		if boardID == "" {
			boardID = models.DefaultBoardID
		}

		items := []models.NotablePR{}
		if err := db.Where("board_id = ?", boardID).
			Order("pr_updated_at desc").Find(&items).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}
		json.NewEncoder(w).Encode(items)
	}
}
