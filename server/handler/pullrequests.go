package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/samouraiworld/topofgnomes/server/handler/viewmodels"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/repository"
)

func GetPullrequestsReportByDate(repo repository.PullRequestRepository) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		startDate := r.URL.Query().Get("startdate")
		endDate := r.URL.Query().Get("enddate")
		var mergedPRs, inProgressPRs, reviewedPRs, waitingForReviewPRs, blockedPRs []models.PullRequest

		if startDate == "" || endDate == "" {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("startdate and enddate are required"))
			return
		}

		// Parse dates (accept RFC3339 or YYYY-MM-DD)
		parseDate := func(s string) (time.Time, error) {
			if t, err := time.Parse(time.RFC3339, s); err == nil {
				return t, nil
			}
			return time.Parse("2006-01-02", s)
		}
		start, err := parseDate(startDate)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("invalid startdate format, use RFC3339 or YYYY-MM-DD"))
			return
		}
		end, err := parseDate(endDate)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("invalid enddate format, use RFC3339 or YYYY-MM-DD"))
			return
		}

		pullRequests, err := repo.FindForReport(start, end)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		for _, pr := range pullRequests {
			switch {
			case pr.State == "MERGED" && pr.MergedAt != nil:
				mergedPRs = append(mergedPRs, pr)
			case pr.State == "OPEN" && pr.IsDraft:
				inProgressPRs = append(inProgressPRs, pr)
			case pr.State == "OPEN" && !pr.IsDraft && pr.ReviewDecision == "APPROVED" &&
				(pr.MergeStateStatus == "CLEAN" || pr.MergeStateStatus == "BEHIND") && pr.MergedAt == nil:
				reviewedPRs = append(reviewedPRs, pr)
			case pr.State == "OPEN" && !pr.IsDraft && pr.ReviewDecision == "REVIEW_REQUIRED" &&
				(pr.Mergeable == "MERGEABLE" || pr.Mergeable == "UNKNOWN"):
				waitingForReviewPRs = append(waitingForReviewPRs, pr)
			case pr.State == "OPEN" && (pr.MergeStateStatus == "BLOCKED" || pr.MergeStateStatus == "UNSTABLE") &&
				pr.ReviewDecision != "APPROVED":
				blockedPRs = append(blockedPRs, pr)
			}
		}

		response := viewmodels.PullRequestsReportResponse{
			Merged:           viewmodels.MapPullRequestList(mergedPRs),
			InProgress:       viewmodels.MapPullRequestList(inProgressPRs),
			Reviewed:         viewmodels.MapPullRequestList(reviewedPRs),
			WaitingForReview: viewmodels.MapPullRequestList(waitingForReviewPRs),
			Blocked:          viewmodels.MapPullRequestList(blockedPRs),
		}

		json.NewEncoder(w).Encode(response)
	}
}
