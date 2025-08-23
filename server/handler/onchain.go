package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

// HandleGetAllPackages handles GET /api/onchain/packages
// It returns all the packages registered on the Gno blockchain
func HandleGetAllPackages(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var pkgs []models.GnoPackage
		if err := db.Find(&pkgs).Error; err != nil {
			log.Printf("[HandleGetAllPackages] DB error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		log.Printf("[HandleGetAllPackages] Found %d packages", len(pkgs))
		json.NewEncoder(w).Encode(pkgs)
	}
}

// HandleGetPackagesByUser handles GET /api/onchain/packages/{address}
// It returns all the packages registered on the Gno blockchain by a specific address
func HandleGetPackagesByUser(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		address := chi.URLParam(r, "address")
		if address == "" {
			log.Printf("[HandleGetPackagesByUser] Missing address parameter")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "address parameter is required"})
			return
		}
		var pkgs []models.GnoPackage
		if err := db.Where("publisher = ?", address).Find(&pkgs).Error; err != nil {
			log.Printf("[HandleGetPackagesByUser] DB error for address %s: %v", address, err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		log.Printf("[HandleGetPackagesByUser] Found %d packages for address %s", len(pkgs), address)
		json.NewEncoder(w).Encode(pkgs)
	}
}

// HandleGetAllNamespaces handles GET /api/onchain/namespaces
// It returns all the namespaces registered on the Gno blockchain
func HandleGetAllNamespaces(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var namespaces []models.GnoNamespace
		if err := db.Find(&namespaces).Error; err != nil {
			log.Printf("[HandleGetAllNamespaces] DB error: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		log.Printf("[HandleGetAllNamespaces] Found %d namespaces", len(namespaces))
		json.NewEncoder(w).Encode(namespaces)
	}
}

// HandleGetNamespacesByUser handles GET /api/onchain/namespaces/{address}
// It returns all the namespaces registered on the Gno blockchain by a specific address
func HandleGetNamespacesByUser(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		address := chi.URLParam(r, "address")
		if address == "" {
			log.Printf("[HandleGetNamespacesByUser] Missing address parameter")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "address parameter is required"})
			return
		}
		var namespaces []models.GnoNamespace
		if err := db.Where("address = ?", address).Find(&namespaces).Error; err != nil {
			log.Printf("[HandleGetNamespacesByUser] DB error for address %s: %v", address, err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		log.Printf("[HandleGetNamespacesByUser] Found %d namespaces for address %s", len(namespaces), address)
		json.NewEncoder(w).Encode(namespaces)
	}
}

// HandleGetAllProposals handles GET /api/onchain/proposals
// It returns all the proposals registered on the Gno blockchain
func HandleGetAllProposals(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var pkgs []models.GnoProposal
		address := r.URL.Query().Get("address")
		query := db.Model(&models.GnoProposal{}).Preload("Files")

		if address != "" {
			query = query.Where("address = ?", address)
		}

		err := query.Find(&pkgs).Error
		if err != nil {
			log.Printf("[HandleGetAllProposals] DB error : %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		json.NewEncoder(w).Encode(pkgs)
	}
}
