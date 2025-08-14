package viewmodels

import "time"

type PullRequestSummary struct {
	ID               string     `json:"id"`
	Number           int        `json:"number"`
	Title            string     `json:"title"`
	State            string     `json:"state"`
	IsDraft          bool       `json:"isDraft"`
	URL              string     `json:"url"`
	AuthorLogin      string     `json:"authorLogin"`
	AuthorAvatarUrl  string     `json:"authorAvatarUrl"`
	ReviewDecision   string     `json:"reviewDecision"`
	MergeStateStatus string     `json:"mergeStateStatus"`
	MergedAt         *time.Time `json:"mergedAt"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type PullRequestsReportResponse struct {
	Merged           []PullRequestSummary `json:"merged"`
	InProgress       []PullRequestSummary `json:"in_progress"`
	Reviewed         []PullRequestSummary `json:"reviewed"`
	WaitingForReview []PullRequestSummary `json:"waiting_for_review"`
	Blocked          []PullRequestSummary `json:"blocked"`
}
