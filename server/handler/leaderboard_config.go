package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

// HandleGetLeaderboardConfigs returns all leaderboard configs for a given userId
func HandleGetLeaderboardConfigs(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		userID := r.URL.Query().Get("userId")
		if strings.TrimSpace(userID) == "" {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "userId is required"})
			return
		}

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
	type body struct {
		ID                   uint   `json:"id"`
		UserID               string `json:"userId"`
		Platform             string `json:"platform"`
		WebhookURL           string `json:"webhookUrl"`
		SelectedRepositories string `json:"selectedRepositories"`
		Timeline             string `json:"timeline"`
		Frequency            string `json:"frequency"`
		AnchorAt             string `json:"anchorAt"` // RFC3339
		Timezone             string `json:"timezone"`
		Active               *bool  `json:"active"`
	}
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var b body
		if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		if strings.TrimSpace(b.UserID) == "" || strings.TrimSpace(b.WebhookURL) == "" {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "userId and webhookUrl are required"})
			return
		}
		// Enforce create-only semantics: reject if ID provided
		if b.ID != 0 {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "POST does not support updates; use PUT /leaderboard/configs/{id}"})
			return
		}

		// Normalize fields
		platform := strings.ToLower(strings.TrimSpace(b.Platform))
		if platform == "" {
			platform = "discord"
		}
		timeline := strings.ToLower(strings.TrimSpace(b.Timeline))
		if timeline == "" {
			timeline = "last_week"
		}
		frequency := strings.ToLower(strings.TrimSpace(b.Frequency))
		if frequency == "" {
			frequency = "weekly"
		}

		cfg := models.LeaderboardConfig{
			ID:                   b.ID,
			UserID:               b.UserID,
			Platform:             platform,
			WebhookURL:           b.WebhookURL,
			SelectedRepositories: b.SelectedRepositories,
			Timeline:             timeline,
			Frequency:            frequency,
		}
		// parse anchorAt if provided
		if strings.TrimSpace(b.AnchorAt) != "" {
			if t, err := time.Parse(time.RFC3339, strings.TrimSpace(b.AnchorAt)); err == nil {
				cfg.AnchorAt = &t
			}
		}
		if strings.TrimSpace(b.Timezone) != "" {
			cfg.Timezone = strings.TrimSpace(b.Timezone)
		}
		if b.Active != nil {
			cfg.Active = *b.Active
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
		userID := r.URL.Query().Get("userId")
		if strings.TrimSpace(userID) == "" {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "userId is required"})
			return
		}
		id, err := strconv.Atoi(idStr)
		if err != nil || id <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid id"})
			return
		}
		if err := db.Where("id = ? AND user_id = ?", id, userID).Delete(&models.LeaderboardConfig{}).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"success": "true"})
	}
}

// HandleUpdateLeaderboardConfigByID updates a specific leaderboard config by id
func HandleUpdateLeaderboardConfigByID(db *gorm.DB) http.HandlerFunc {
	type body struct {
		UserID               string  `json:"userId"`
		Platform             *string `json:"platform"`
		WebhookURL           *string `json:"webhookUrl"`
		SelectedRepositories *string `json:"selectedRepositories"`
		Timeline             *string `json:"timeline"`
		Frequency            *string `json:"frequency"`
		Active               *bool   `json:"active"`
		AnchorAt             *string `json:"anchorAt"` // RFC3339
		Timezone             *string `json:"timezone"`
	}
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		idStr := chi.URLParam(r, "id")
		id, err := strconv.Atoi(idStr)
		if err != nil || id <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "invalid id"})
			return
		}

		var b body
		if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		if strings.TrimSpace(b.UserID) == "" {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "userId is required"})
			return
		}

		updates := map[string]interface{}{}
		if b.Platform != nil && strings.TrimSpace(*b.Platform) != "" {
			t := strings.ToLower(strings.TrimSpace(*b.Platform))
			updates["platform"] = t
		}
		if b.WebhookURL != nil {
			updates["webhook_url"] = strings.TrimSpace(*b.WebhookURL)
		}
		if b.SelectedRepositories != nil {
			updates["selected_repositories"] = strings.TrimSpace(*b.SelectedRepositories)
		}
		if b.Timeline != nil {
			updates["timeline"] = strings.ToLower(strings.TrimSpace(*b.Timeline))
		}
		if b.Frequency != nil {
			updates["frequency"] = strings.ToLower(strings.TrimSpace(*b.Frequency))
		}
		if b.Active != nil {
			updates["active"] = *b.Active
		}

		// Parse optional anchorAt/timezone
		if b.AnchorAt != nil && strings.TrimSpace(*b.AnchorAt) != "" {
			if t, err := time.Parse(time.RFC3339, strings.TrimSpace(*b.AnchorAt)); err == nil {
				updates["anchor_at"] = t
			}
		}
		if b.Timezone != nil && strings.TrimSpace(*b.Timezone) != "" {
			updates["timezone"] = strings.TrimSpace(*b.Timezone)
		}

		if len(updates) == 0 {
			_ = json.NewEncoder(w).Encode(map[string]string{"success": "true"})
			return
		}

		if err := db.Model(&models.LeaderboardConfig{}).Where("id = ? AND user_id = ?", id, b.UserID).Updates(updates).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		var cfg models.LeaderboardConfig
		if err := db.First(&cfg, id).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		_ = json.NewEncoder(w).Encode(cfg)
	}
}
