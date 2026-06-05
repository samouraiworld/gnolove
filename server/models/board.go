package models

// BoardConfig describes one GitHub Projects-v2 board that gnolove mirrors into
// the local DB and exposes on /projects/boards. The registry is code-owned
// (boards change rarely and the area/status mapping is code-coupled).
//
// AreaSource selects how an item's area is derived:
//   - "field": read the single-select field named AreaField (e.g. #66 "Main Area").
//   - "label": map the first matching label in AreaLabels to its canonical area
//     (e.g. #38 has no area field — areas live as a/* labels).
type BoardConfig struct {
	ID            string            // stable slug used in the API + frontend
	Label         string            // human display name
	Owner         string            // org login
	Number        int               // project number
	AreaSource    string            // "field" | "label"
	AreaField     string            // single-select field name when AreaSource=="field"
	AreaLabels    map[string]string // label -> canonical area when AreaSource=="label"
	Areas         []string          // canonical area order (taxonomy for the frontend)
	Statuses      []string          // status column order for this board
	IncludeIssues bool              // also ingest issues (not only PRs)
}

// NotableBoards is the curated set of boards mirrored into gnolove.
//
//   - #66 "Notable PRs by Area": curated, has a "Main Area" single-select field,
//     PR-only, 3 statuses. This is the default board.
//   - #38 "Gno.land development": the full dev board (PRs + issues), area derived
//     from a/* labels, 6 statuses.
var NotableBoards = []BoardConfig{
	{
		ID: "notable", Label: "Notable PRs", Owner: "gnolang", Number: 66,
		AreaSource: "field", AreaField: "Main Area",
		Areas:    []string{"VM", "Blockchain", "Gnops", "Gno.land", "UX"},
		Statuses: []string{"Todo", "In progress", "Done"},
	},
	{
		ID: "gnoland-dev", Label: "Gno.land development", Owner: "gnolang", Number: 38,
		AreaSource: "label",
		AreaLabels: map[string]string{
			"a/blockchain": "Blockchain", "a/vm": "VM", "a/gnops": "Gnops",
			"a/ux": "UX", "a/gnoland": "Gno.land",
		},
		Areas:         []string{"Blockchain", "VM", "Gnops", "UX", "Gno.land"},
		Statuses:      []string{"Triage", "Backlog", "Todo", "In Progress", "In Review", "Done"},
		IncludeIssues: true,
	},
}

// DefaultBoardID is served when a request omits ?board= (back-compat with the
// original single-board /projects/notable route).
const DefaultBoardID = "notable"

// BoardByID returns the board config for id, or false if unknown.
func BoardByID(id string) (BoardConfig, bool) {
	for _, b := range NotableBoards {
		if b.ID == id {
			return b, true
		}
	}
	return BoardConfig{}, false
}

// BoardMeta is the public, frontend-facing shape of a board (no internal
// mapping fields) returned by GET /projects/boards.
type BoardMeta struct {
	ID       string   `json:"id"`
	Label    string   `json:"label"`
	Owner    string   `json:"owner"`
	Number   int      `json:"number"`
	Areas    []string `json:"areas"`
	Statuses []string `json:"statuses"`
}

// BoardMetas projects the registry into its public metadata form.
func BoardMetas() []BoardMeta {
	metas := make([]BoardMeta, 0, len(NotableBoards))
	for _, b := range NotableBoards {
		metas = append(metas, BoardMeta{
			ID: b.ID, Label: b.Label, Owner: b.Owner, Number: b.Number,
			Areas: b.Areas, Statuses: b.Statuses,
		})
	}
	return metas
}
