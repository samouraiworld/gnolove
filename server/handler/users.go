package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"github.com/samouraiworld/topofgnomes/server/models"
)

// HandleGetUserByWallet returns a single user by wallet address
func HandleGetUserByWallet(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		address := chi.URLParam(r, "address")
		if address == "" {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("address is required"))
			return
		}

		var user models.User
		if err := db.Where("LOWER(wallet) = ?", strings.ToLower(address)).First(&user).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				w.WriteHeader(http.StatusNotFound)
				w.Write([]byte("user not found"))
				return
			}
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		json.NewEncoder(w).Encode(user)
	}
}

// HandleGetUsersByWallets returns users filtered by one or more wallet addresses.
// Supports:
// - GET /users?wallet=<addr>
// - GET /users?wallets=<addr1>,<addr2>
// - GET /users?wallets=<addr1>&wallets=<addr2> (repeated query param)
func HandleGetUsersByWallets(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Allow either single wallet or multiple wallets
		wallet := r.URL.Query().Get("wallet")
		walletsParam := r.URL.Query()["wallets"]

		wallets := make([]string, 0)
		if wallet != "" {
			wallets = append(wallets, wallet)
		}
		for _, part := range walletsParam {
			if part == "" {
				continue
			}
			// Support comma-separated lists inside a single wallets parameter
			for _, w := range strings.Split(part, ",") {
				w = strings.TrimSpace(w)
				if w != "" {
					wallets = append(wallets, w)
				}
			}
		}

		if len(wallets) == 0 {
			// If no filter provided, return all users
			var users []models.User
			if err := db.Find(&users).Error; err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(err.Error()))
				return
			}
			json.NewEncoder(w).Encode(users)
			return
		}

		// Normalize to lowercase to ensure case-insensitive matching
		lower := make([]string, 0, len(wallets))
		for _, waddr := range wallets {
			lower = append(lower, strings.ToLower(waddr))
		}

		var users []models.User
		if err := db.Where("LOWER(wallet) IN ?", lower).Find(&users).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		json.NewEncoder(w).Encode(users)
	}
}
