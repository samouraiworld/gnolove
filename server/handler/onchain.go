package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

// HandleGetAllPackages handles GET /api/onchain/packages
// It returns all the packages registered on the Gno blockchain
func HandleGetAllPackages(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var pkgs []models.GnoPackage
		if err := db.Find(&pkgs).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pkgs)
	}
}

// HandleGetPackagesByUser handles GET /api/onchain/packages/{address}
// It returns all the packages registered on the Gno blockchain by a specific address
func HandleGetPackagesByUser(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		address := chi.URLParam(r, "address")
		var pkgs []models.GnoPackage
		if err := db.Where("publisher = ?", address).Find(&pkgs).Error; err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(pkgs)
	}
}
