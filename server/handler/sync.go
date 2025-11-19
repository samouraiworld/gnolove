package handler

import (
	"encoding/json"
	"net/http"
	"time"

	syncpkg "github.com/samouraiworld/topofgnomes/server/sync"
)

func HandleGetLastSync(syncer *syncpkg.Syncer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var lastSyncedAt *string
		if !syncer.LastSyncedAt().IsZero() {
			formmattedDate := syncer.LastSyncedAt().Format(time.RFC3339)
			lastSyncedAt = &formmattedDate
		}
		json.NewEncoder(w).Encode(map[string]*string{"lastSyncedAt": lastSyncedAt})
	}
}
