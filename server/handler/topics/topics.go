// Package topics wires the /topics endpoint that exposes the Focus Areas
// taxonomy (gnolove/server/config/topics.yaml) to the Memba frontend.
package topics

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/samouraiworld/topofgnomes/server/topics"
)

type topicsResponse struct {
	SchemaVersion int            `json:"schemaVersion"`
	LastSyncedAt  time.Time      `json:"lastSyncedAt"`
	Topics        []topics.Topic `json:"topics"`
}

// HandleGetAll serves the full topic taxonomy with the file mtime so the
// frontend can bust its query cache when ops re-deploys the YAML.
func HandleGetAll(cfg *topics.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(topicsResponse{
			SchemaVersion: cfg.SchemaVersion,
			LastSyncedAt:  cfg.LastSyncedAt,
			Topics:        cfg.Topics,
		})
	}
}
