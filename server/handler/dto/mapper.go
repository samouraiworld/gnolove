package dto

import (
	"github.com/samouraiworld/topofgnomes/server/models"
)

func MapPullRequestSummary(m models.PullRequest) PullRequestSummary {
	var login, avatar string
	if m.Author != nil {
		login = m.Author.Login
		avatar = m.Author.AvatarUrl
	}
	return PullRequestSummary{
		ID:               m.ID,
		Number:           m.Number,
		Title:            m.Title,
		State:            m.State,
		IsDraft:          m.IsDraft,
		URL:              m.URL,
		AuthorLogin:      login,
		AuthorAvatarUrl:  avatar,
		ReviewDecision:   m.ReviewDecision,
		MergeStateStatus: m.MergeStateStatus,
		MergedAt:         m.MergedAt,
		CreatedAt:        m.CreatedAt,
		UpdatedAt:        m.UpdatedAt,
	}
}

func MapPullRequestList(ms []models.PullRequest) []PullRequestSummary {
	out := make([]PullRequestSummary, 0, len(ms))
	for _, m := range ms {
		out = append(out, MapPullRequestSummary(m))
	}
	return out
}
