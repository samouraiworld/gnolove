package ai

import "testing"

func TestEstimateTokens_Heuristic(t *testing.T) {
	// 4 chars per token, conservative ceiling-divide.
	cases := []struct {
		s    string
		want int
	}{
		{"", 0},
		{"abcd", 1},
		{"abcde", 2},
		{"abcdefghij", 3},
	}
	for _, tc := range cases {
		if got := estimateTokens(tc.s); got != tc.want {
			t.Errorf("estimateTokens(%q) = %d, want %d", tc.s, got, tc.want)
		}
	}
}

func TestChunkProjects_UnderBudgetSendsOne(t *testing.T) {
	projects := []ProjectInput{
		{ProjectName: "a/x", PullRequests: []map[string]any{{"title": "tiny"}}},
		{ProjectName: "b/y", PullRequests: []map[string]any{{"title": "tiny"}}},
	}
	chunks := chunkProjects(projects, 100_000) // huge budget
	if len(chunks) != 1 {
		t.Fatalf("chunks = %d, want 1", len(chunks))
	}
	if len(chunks[0]) != 2 {
		t.Errorf("chunk[0] len = %d, want 2", len(chunks[0]))
	}
}

func TestChunkProjects_OverBudgetSplitsByFour(t *testing.T) {
	// 10 projects, tiny budget → should split into 3 chunks of 4, 4, 2.
	projects := make([]ProjectInput, 10)
	for i := range projects {
		projects[i] = ProjectInput{
			ProjectName: "p" + string(rune('a'+i)),
			PullRequests: []map[string]any{
				// Pad each project so the heuristic flags us over budget.
				{"title": "x"},
			},
		}
	}
	chunks := chunkProjects(projects, 1) // 1-token budget forces splitting
	want := []int{4, 4, 2}
	if len(chunks) != len(want) {
		t.Fatalf("chunks = %d, want %d", len(chunks), len(want))
	}
	for i, c := range chunks {
		if len(c) != want[i] {
			t.Errorf("chunk[%d] len = %d, want %d", i, len(c), want[i])
		}
	}
}

func TestChunkProjects_EmptyInput(t *testing.T) {
	if got := chunkProjects(nil, 1000); len(got) != 0 {
		t.Errorf("chunkProjects(nil) = %v, want empty", got)
	}
}
