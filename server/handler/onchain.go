package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/sync"
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
		query := db.Model(&models.GnoProposal{}).Preload("Files").Preload("Votes")

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

// HandleGetProposal handles GET /api/onchain/proposals/{id}
// It returns a specific proposal registered on the Gno blockchain
func HandleGetProposal(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var proposal models.GnoProposal
		id := chi.URLParam(r, "id")

		if id == "" {
			log.Printf("[HandleGetProposal] Missing id parameter")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "id parameter is required"})
			return
		}

		err := db.Model(&models.GnoProposal{}).Preload("Files").Preload("Votes").Where("id = ?", id).First(&proposal).Error

		if err != nil {
			if err == gorm.ErrRecordNotFound {
				log.Printf("[HandleGetProposal] Proposal not found: %s", id)
				w.WriteHeader(http.StatusNotFound)
				json.NewEncoder(w).Encode(map[string]string{"error": "proposal not found"})
				return
			}
			log.Printf("[HandleGetProposal] DB error : %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		json.NewEncoder(w).Encode(proposal)
	}
}

// HandleGetGovdaoMembers handles GET /api/onchain/govdao-members
// It returns all the current govdao members registered on the Gno blockchain
func HandleGetGovdaoMembers(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var members []models.GovDaoMember
		query := db.Model(&models.GovDaoMember{})

		err := query.Find(&members).Error
		if err != nil {
			log.Printf("[HandleGetAllProposals] DB error : %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}
		json.NewEncoder(w).Encode(members)
	}
}

// HandleGetVotesByUser handles GET /onchain/votes/{address}
// It returns the list of votes made by a specific address across all proposals.
func HandleGetVotesByUser(db *gorm.DB) http.HandlerFunc {
	type voteWithProposal struct {
		ProposalID    string `json:"proposalId"`
		ProposalTitle string `json:"proposalTitle"`
		Vote          string `json:"vote"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		address := chi.URLParam(r, "address")
		if address == "" {
			log.Printf("[HandleGetVotesByUser] Missing address parameter")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "address parameter is required"})
			return
		}

		var results []voteWithProposal
		err := db.Table("gno_votes as v").
			Select("p.id as proposal_id, p.title as proposal_title, v.vote").
			Joins("JOIN gno_proposals p ON p.id = v.proposal_id").
			Where("v.address = ?", address).
			Order("p.block_height DESC, v.block_height DESC").
			Scan(&results).Error
		if err != nil {
			log.Printf("[HandleGetVotesByUser] DB error for address %s: %v", address, err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(results)
	}
}

func HandleSynchronizeVotes(syncer *sync.Syncer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		for i := 0; i < 10; i++ {
			// silly way to retry until indexing the new vote
			// Maybe we could improve it with server events ?
			time.Sleep(time.Second)
			newVotes, err := syncer.SyncVotesOnProposals(r.Context())
			if err != nil {
				log.Printf("[HandleSynchronizeVotes] DB error : %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
				return
			}
			if newVotes{
				break
			}
		}

		w.WriteHeader(http.StatusOK)
	}
}
