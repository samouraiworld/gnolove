package teams

import "testing"

// Helper to build a RepoCount fixture: map[repoID]team-prs.
// teamTotal and repoTotals are passed separately for clarity.
func TestComputeActiveRepos_DualThreshold(t *testing.T) {
	cases := []struct {
		name        string
		teamPRs     map[string]int // repoID -> team's merged PRs
		repoTotals  map[string]int // repoID -> all merged PRs in that repo
		wantPrimary []string       // repoIDs, sorted desc by team PRs
		wantSecond  []string
	}{
		{
			name: "above both thresholds is primary",
			// team total = 100; repoA = 10 (10% of team) / repoA total 100 (10% of repo) → primary
			teamPRs:     map[string]int{"a/x": 10},
			repoTotals:  map[string]int{"a/x": 100},
			wantPrimary: []string{"a/x"},
		},
		{
			name: "above team-share but below repo-share is secondary",
			// team total = 50; repoA = 5 (10% of team) but repo total 200 → 2.5% of repo → secondary
			teamPRs:    map[string]int{"a/x": 5},
			repoTotals: map[string]int{"a/x": 200},
			wantSecond: []string{"a/x"},
		},
		{
			name: "above repo-share but below team-share is secondary",
			// team total = 1000; repoA = 10 (1% of team) but repo total 50 → 20% of repo → secondary
			teamPRs:    map[string]int{"a/x": 10, "b/y": 990},
			repoTotals: map[string]int{"a/x": 50, "b/y": 990},
			wantSecond: []string{"a/x"},
			wantPrimary: []string{
				"b/y", // 99% of team's PRs, 100% of repo's PRs
			},
		},
		{
			name: "zero team prs in repo is omitted",
			teamPRs:    map[string]int{"a/x": 0},
			repoTotals: map[string]int{"a/x": 100},
		},
		{
			name: "sort primary by team-pr count desc",
			// team total = 30; both repos pass dual threshold but different scales
			teamPRs:     map[string]int{"a/big": 20, "b/small": 10},
			repoTotals:  map[string]int{"a/big": 100, "b/small": 50},
			wantPrimary: []string{"a/big", "b/small"},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := ComputeActiveRepos(tc.teamPRs, tc.repoTotals)
			gotPrimary := repoIDs(got.Primary)
			gotSecondary := repoIDs(got.Secondary)
			if !equal(gotPrimary, tc.wantPrimary) {
				t.Errorf("primary = %v, want %v", gotPrimary, tc.wantPrimary)
			}
			if !equal(gotSecondary, tc.wantSecond) {
				t.Errorf("secondary = %v, want %v", gotSecondary, tc.wantSecond)
			}
		})
	}
}

func TestComputeActiveRepos_PopulatesPercentages(t *testing.T) {
	teamPRs := map[string]int{"a/x": 10}
	repoTotals := map[string]int{"a/x": 100}
	got := ComputeActiveRepos(teamPRs, repoTotals)
	if len(got.Primary) != 1 {
		t.Fatalf("primary count = %d, want 1", len(got.Primary))
	}
	r := got.Primary[0]
	if r.TeamPRs != 10 || r.TotalPRs != 100 {
		t.Errorf("counts = (%d, %d), want (10, 100)", r.TeamPRs, r.TotalPRs)
	}
	if r.PctOfRepo != 0.1 {
		t.Errorf("pct of repo = %v, want 0.1", r.PctOfRepo)
	}
	if r.PctOfTeam != 1.0 {
		t.Errorf("pct of team = %v, want 1.0", r.PctOfTeam)
	}
}

func TestComputeActiveRepos_EmptyTeamReturnsEmpty(t *testing.T) {
	got := ComputeActiveRepos(map[string]int{}, map[string]int{"a/x": 50})
	if len(got.Primary)+len(got.Secondary) != 0 {
		t.Errorf("want empty result, got primary=%d secondary=%d", len(got.Primary), len(got.Secondary))
	}
}

func TestComputeActiveRepos_BoundaryExactlyAtThreshold(t *testing.T) {
	// Boundary is "strictly greater than" — exactly 2% of team / 5% of repo is NOT primary.
	// team total = 100; repoA = 2 (exactly 2% of team) / repo total 40 (5% of repo).
	got := ComputeActiveRepos(map[string]int{"a/x": 2, "z/z": 98}, map[string]int{"a/x": 40, "z/z": 98})
	for _, r := range got.Primary {
		if r.RepoID == "a/x" {
			t.Errorf("a/x at exact threshold should not be primary, got %+v", r)
		}
	}
}

func repoIDs(rs []ActiveRepo) []string {
	out := make([]string, len(rs))
	for i, r := range rs {
		out[i] = r.RepoID
	}
	return out
}

func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
