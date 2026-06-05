package models

import "time"

// NotablePRLabel is a GitHub label on a notable PR (name + hex color, no '#').
type NotablePRLabel struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

// NotablePRReview is a completed review on a notable PR.
type NotablePRReview struct {
	Login string `json:"login"`
	// State: APPROVED / CHANGES_REQUESTED / COMMENTED / DISMISSED / PENDING.
	State string `json:"state"`
}

// NotablePR is one pull-request item from the gnolang "Notable PRs by Area"
// GitHub Project board (org project #66, https://github.com/orgs/gnolang/projects/66).
//
// The board gathers PRs that need review or help so area leaders can surface
// them. We mirror it read-only into gnolove. The board may also contain draft
// issues / issues; those are skipped at sync time (only PR-backed items land here).
type NotablePR struct {
	// ItemID is the ProjectV2Item node id — the stable board-entry identifier.
	ItemID string `gorm:"primarykey" json:"itemID"`

	Number          int    `json:"number"`
	Title           string `json:"title"`
	URL             string `json:"url"`
	Repository      string `json:"repository"` // "owner/name"
	AuthorLogin     string `json:"authorLogin"`
	AuthorAvatarURL string `json:"authorAvatarUrl"`
	State           string `json:"state"` // OPEN / MERGED / CLOSED
	IsDraft         bool   `json:"isDraft"`
	// ReviewDecision: REVIEW_REQUIRED / APPROVED / CHANGES_REQUESTED / "".
	ReviewDecision string `json:"reviewDecision"`

	// Board single-select columns.
	Status   string `json:"status"`   // Todo / In progress / Done
	MainArea string `json:"mainArea"` // UX / Blockchain / VM / Gnops / Gno.land

	Additions int `json:"additions"`
	Deletions int `json:"deletions"`

	Labels             []NotablePRLabel  `gorm:"serializer:json" json:"labels"`
	Assignees          []string          `gorm:"serializer:json" json:"assignees"`
	RequestedReviewers []string          `gorm:"serializer:json" json:"requestedReviewers"`
	Reviews            []NotablePRReview `gorm:"serializer:json" json:"reviews"`

	// PR timestamps — named OpenedAt / PRUpdatedAt (NOT CreatedAt/UpdatedAt) so
	// GORM does not auto-manage them; they must hold the PR's real GitHub times.
	OpenedAt    time.Time `json:"createdAt"`
	PRUpdatedAt time.Time `json:"updatedAt"`

	// SyncedAt is set on every sync pass; used to prune items removed from the board.
	SyncedAt time.Time `json:"syncedAt"`
}
