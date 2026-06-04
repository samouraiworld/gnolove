package models

import "time"

// NotablePR is one pull-request item from the gnolang "Notable PRs" GitHub
// Project board (org project #66, https://github.com/orgs/gnolang/projects/66).
//
// The board gathers PRs that need review or help so area leaders can surface
// them. We mirror it read-only into gnolove. The board may also contain draft
// issues / issues; those are skipped at sync time (only PR-backed items land
// here).
type NotablePR struct {
	// ItemID is the ProjectV2Item node id — the stable board-entry identifier.
	ItemID string `gorm:"primarykey" json:"itemID"`

	Number      int    `json:"number"`
	Title       string `json:"title"`
	URL         string `json:"url"`
	Repository  string `json:"repository"`  // "owner/name"
	AuthorLogin string `json:"authorLogin"`
	State       string `json:"state"`       // OPEN / MERGED / CLOSED
	IsDraft     bool   `json:"isDraft"`
	// ReviewDecision: REVIEW_REQUIRED / APPROVED / CHANGES_REQUESTED / "".
	ReviewDecision string `json:"reviewDecision"`
	// Status is the board's single-select "Status" column (e.g. "Needs review").
	Status string `json:"status"`

	UpdatedAt time.Time `json:"updatedAt"`
	// SyncedAt is set on every sync pass; used to prune items removed from the board.
	SyncedAt time.Time `json:"syncedAt"`
}
