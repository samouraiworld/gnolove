package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

// Get all users. Optionally filtered by addresses (comma-separated)
func HandleGetUsers(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var users []models.User
		// Get users depending on the addresses query parameter
		wallets := r.URL.Query().Get("addresses")
		if wallets != "" {
			addresses := strings.Split(wallets, ",")
			err := db.Model(&models.User{}).Where("wallet IN ?", addresses).Find(&users).Error
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(err.Error()))
				return
			}
		} else {
			err := db.Model(&models.User{}).Find(&users).Error
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(err.Error()))
				return
			}
		}
		json.NewEncoder(w).Encode(users)
	}
}

// Get a user based on their address
func HandleGetUser(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		address := r.PathValue("address")
		if address == "" {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("address is required"))
			return
		}

		var user models.User
		err := db.Model(&models.User{}).Where("wallet = ?", address).First(&user).Error
		if err != nil {
			// A wallet without a gnolove account is not a server failure. The body
			// stays "record not found", which clients already read as "no account".
			status := http.StatusInternalServerError
			if errors.Is(err, gorm.ErrRecordNotFound) {
				status = http.StatusNotFound
			}
			w.WriteHeader(status)
			w.Write([]byte(err.Error()))
			return
		}
		json.NewEncoder(w).Encode(user)
	}
}
