package handler

import (
	"encoding/json"
	"net/http"
)

// Tweak values if we need to favor one type of contribution over another
const (
	CommitFactor     = 10
	IssueFactor      = 0.5
	PRFactor         = 2
	ReviewedMRFactor = 2
)

func CalculateScore(commits, issues, prs, reviewed int64) float64 {
	return float64(commits)*CommitFactor + float64(issues)*IssueFactor + float64(prs)*PRFactor + float64(reviewed)*ReviewedMRFactor
}

// HandleGetScoreFactors returns the score factors as JSON
func HandleGetScoreFactors(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	factors := map[string]float64{
		"commitFactor":     CommitFactor,
		"issueFactor":      IssueFactor,
		"prFactor":         PRFactor,
		"reviewedMrFactor": ReviewedMRFactor,
	}
	json.NewEncoder(w).Encode(factors)
}
