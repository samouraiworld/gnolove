package teams

import "sort"

// Dual-threshold rule (operator Q-2 confirmed):
//   Primary  iff team's PRs in repo > 2% of team total AND > 5% of repo total.
//   Else if team contributed any PRs, it's Secondary ("also contributes to").
//   Strict ">" — exact boundary doesn't qualify.
const (
	primaryTeamShareThreshold = 0.02
	primaryRepoShareThreshold = 0.05
)

type ActiveRepo struct {
	RepoID    string  `json:"repoId"`
	TeamPRs   int     `json:"teamPRs"`
	TotalPRs  int     `json:"totalPRs"`
	PctOfTeam float64 `json:"pctOfTeam"`
	PctOfRepo float64 `json:"pctOfRepo"`
}

type ActiveRepos struct {
	Primary   []ActiveRepo `json:"primary"`
	Secondary []ActiveRepo `json:"secondary"`
}

// ComputeActiveRepos applies the dual-threshold rule. Callers pass:
//   - teamPRs:    map[repoID]merged-PR-count for THIS team
//   - repoTotals: map[repoID]merged-PR-count across ALL authors
//
// Result is sorted by team-PR count descending within each bucket.
func ComputeActiveRepos(teamPRs, repoTotals map[string]int) ActiveRepos {
	teamTotal := 0
	for _, n := range teamPRs {
		teamTotal += n
	}
	out := ActiveRepos{}
	if teamTotal == 0 {
		return out
	}
	for repoID, n := range teamPRs {
		if n == 0 {
			continue
		}
		repoTotal := repoTotals[repoID]
		if repoTotal == 0 {
			// Team has PRs but our total snapshot doesn't — treat as secondary.
			repoTotal = n
		}
		row := ActiveRepo{
			RepoID:    repoID,
			TeamPRs:   n,
			TotalPRs:  repoTotal,
			PctOfTeam: float64(n) / float64(teamTotal),
			PctOfRepo: float64(n) / float64(repoTotal),
		}
		if row.PctOfTeam > primaryTeamShareThreshold && row.PctOfRepo > primaryRepoShareThreshold {
			out.Primary = append(out.Primary, row)
		} else {
			out.Secondary = append(out.Secondary, row)
		}
	}
	sortByTeamPRs(out.Primary)
	sortByTeamPRs(out.Secondary)
	return out
}

func sortByTeamPRs(rs []ActiveRepo) {
	sort.SliceStable(rs, func(i, j int) bool {
		if rs[i].TeamPRs != rs[j].TeamPRs {
			return rs[i].TeamPRs > rs[j].TeamPRs
		}
		return rs[i].RepoID < rs[j].RepoID
	})
}
