package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	clerk "github.com/clerk/clerk-sdk-go/v2"
	"github.com/go-chi/chi/v5"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func normalizeLeaderboardConfig(cfg *models.LeaderboardConfig, isCreate bool) error {
	if isCreate {
		if cfg.ID != 0 {
			return fmt.Errorf("POST does not support updates; use PUT /leaderboard/configs/{id}")
		}
	}

	if strings.TrimSpace(cfg.WebhookURL) == "" {
		return fmt.Errorf("webhookUrl is required")
	}

	cfg.Platform = strings.ToLower(strings.TrimSpace(cfg.Platform))
	cfg.Timeline = strings.ToLower(strings.TrimSpace(cfg.Timeline))
	cfg.Frequency = strings.ToLower(strings.TrimSpace(cfg.Frequency))
	cfg.Timezone = strings.TrimSpace(cfg.Timezone)

	if cfg.Platform == "" {
		cfg.Platform = "discord"
	}
	if cfg.Timeline == "" {
		cfg.Timeline = "last_week"
	}
	if cfg.Frequency == "" {
		cfg.Frequency = "weekly"
	}
	if cfg.Timezone == "" {
		cfg.Timezone = "UTC"
	}

	return nil
}

// HandleGetLeaderboardConfigs returns all leaderboard configs for a given userId
func HandleGetLeaderboardConfigs(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok || strings.TrimSpace(claims.Subject) == "" {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}
		userID := claims.Subject

		var configs []models.LeaderboardConfig
		if err := db.Where("user_id = ?", userID).Order("id desc").Find(&configs).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		_ = json.NewEncoder(w).Encode(configs)
	}
}

// HandleCreateLeaderboardConfig creates a new leaderboard config
func HandleCreateLeaderboardConfig(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok || strings.TrimSpace(claims.Subject) == "" {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}
		userID := claims.Subject
		var cfg models.LeaderboardConfig
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		// Set authenticated user
		cfg.UserID = userID

		if err := normalizeLeaderboardConfig(&cfg, true); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		if err := db.Create(&cfg).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		_ = json.NewEncoder(w).Encode(cfg)
	}
}

// HandleDeleteLeaderboardConfig deletes a config by id for a user
func HandleDeleteLeaderboardConfig(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		idStr := chi.URLParam(r, "id")
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok || strings.TrimSpace(claims.Subject) == "" {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}
		userID := claims.Subject
		id, err := strconv.Atoi(idStr)
		if err != nil || id <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid id"})
			return
		}
		var conf models.LeaderboardConfig
		db.Model(&models.LeaderboardConfig{}).Where("id = ?", id).Find(&conf)
		// check if user can delete it
		if conf.UserID != userID {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}
		db.Delete(&conf)
		_ = json.NewEncoder(w).Encode(map[string]string{"success": "true"})
	}
}

// HandleUpdateLeaderboardConfigByID updates a specific leaderboard config by id
func HandleUpdateLeaderboardConfigByID(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		claims, ok := clerk.SessionClaimsFromContext(r.Context())
		if !ok || strings.TrimSpace(claims.Subject) == "" {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}
		userID := claims.Subject
		idStr := chi.URLParam(r, "id")
		id, err := strconv.Atoi(idStr)
		if err != nil || id <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid id"})
			return
		}

		var cfg models.LeaderboardConfig
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		// Enforce ownership: ensure the record exists and belongs to the user
		var existing models.LeaderboardConfig
		if err := db.First(&existing, id).Error; err != nil {
			w.WriteHeader(http.StatusNotFound)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "not found"})
			return
		}
		if existing.UserID != userID {
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "unauthorized"})
			return
		}

		// Override path/user derived fields
		cfg.ID = uint(id)
		cfg.UserID = userID

		if err := normalizeLeaderboardConfig(&cfg, false); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		// Preserve server-managed fields
		cfg.CreatedAt = existing.CreatedAt
		cfg.NextRunAt = existing.NextRunAt
		cfg.LastRunAt = existing.LastRunAt

		if err := db.Save(&cfg).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		_ = json.NewEncoder(w).Encode(cfg)
	}
}
