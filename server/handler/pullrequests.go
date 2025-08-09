package handler

import (
	"encoding/json"
	"net/http"

	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func GetPullrequestsReportByDate(db *gorm.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		startDate := r.URL.Query().Get("startdate")
		endDate := r.URL.Query().Get("enddate")
		var pullRequests []models.PullRequest
		var mergedPRs, inProgressPRs, reviewedPRs, waitingForReviewPRs, blockedPRs []models.PullRequest

		if startDate == "" || endDate == "" {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("startdate and enddate are required"))
			return
		}

		err := db.Model(&models.PullRequest{}).Preload("Author").Preload("Reviews").
			Where("(created_at >= ? AND created_at <= ?) OR (created_at < ? AND state = 'OPEN')", startDate, endDate, startDate).
			Find(&pullRequests).Error
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		for _, pr := range pullRequests {
			switch {
			case pr.State == "MERGED" && pr.MergedAt != nil:
				mergedPRs = append(mergedPRs, pr)
			case pr.State == "OPEN" && (pr.ReviewDecision == "" || pr.ReviewDecision == "REVIEW_REQUIRED") &&
				(pr.Mergeable == "MERGEABLE" || pr.Mergeable == "UNKNOWN") && len(pr.Reviews) == 0:
				inProgressPRs = append(inProgressPRs, pr)
			case pr.State == "OPEN" && pr.ReviewDecision == "APPROVED" &&
				(pr.MergeStateStatus == "CLEAN" || pr.MergeStateStatus == "BEHIND") && pr.MergedAt == nil:
				reviewedPRs = append(reviewedPRs, pr)
			case pr.State == "OPEN" && pr.ReviewDecision == "REVIEW_REQUIRED" &&
				(pr.Mergeable == "MERGEABLE" || pr.Mergeable == "UNKNOWN"):
				waitingForReviewPRs = append(waitingForReviewPRs, pr)
			case pr.State == "OPEN" && (pr.MergeStateStatus == "BLOCKED" || pr.MergeStateStatus == "UNSTABLE") &&
				pr.ReviewDecision != "APPROVED":
				blockedPRs = append(blockedPRs, pr)
			}
		}

		response := map[string][]models.PullRequest{
			"merged":             mergedPRs,
			"in_progress":        inProgressPRs,
			"reviewed":           reviewedPRs,
			"waiting_for_review": waitingForReviewPRs,
			"blocked":            blockedPRs,
		}

		json.NewEncoder(w).Encode(response)
	}
}
