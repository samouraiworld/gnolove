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

// NotablePR is one item mirrored from a gnolang GitHub Project board (see
// models.NotableBoards). We mirror boards read-only into gnolove.
//
// Items can be pull requests or, on boards configured with IncludeIssues,
// issues — distinguished by ItemType. Issue items leave PR-only fields
// (ReviewDecision, Additions/Deletions, IsDraft, Reviews…) zero-valued.
type NotablePR struct {
	// ItemID is the ProjectV2Item node id — globally unique across boards.
	ItemID string `gorm:"primarykey" json:"itemID"`

	// BoardID is the source board slug (see models.BoardConfig.ID).
	BoardID string `gorm:"index" json:"boardId"`
	// ItemType is "pr" or "issue".
	ItemType string `json:"itemType"`

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
