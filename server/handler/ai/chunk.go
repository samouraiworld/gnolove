package ai

import "encoding/json"

// Mistral's context window is 32K tokens. We hold a 4K-token margin for the
// system prompt + schema + response so the actual per-request budget is 28K.
const mistralInputTokenBudget = 28000

// projectsPerChunk is the per-batch project count when we need to split.
// Operator-set: 4. Tuned for the ~50-repo curated allowlist landing in 2b.
const projectsPerChunk = 4

// ProjectInput is the per-repository slice of PRs + issues handed to the LLM.
// Pre-grouping by project (instead of one big {prs, issues} blob) is what
// makes the chunking guard possible.
type ProjectInput struct {
	ProjectName  string                   `json:"project_name"`
	PullRequests []map[string]interface{} `json:"pullRequests"`
	Issues       []map[string]interface{} `json:"issues"`
}

// estimateTokens uses the cheap 4-chars-per-token heuristic. Good enough
// for budget decisions — we only need to know "is this WAY over" not the
// exact count.
func estimateTokens(s string) int {
	if s == "" {
		return 0
	}
	return (len(s) + 3) / 4
}

// chunkProjects returns either [projects] (single chunk) when the JSON
// estimate is under budget, or N chunks of `projectsPerChunk` each when over.
func chunkProjects(projects []ProjectInput, budgetTokens int) [][]ProjectInput {
	if len(projects) == 0 {
		return nil
	}
	encoded, _ := json.Marshal(projects)
	if estimateTokens(string(encoded)) <= budgetTokens {
		return [][]ProjectInput{projects}
	}
	var out [][]ProjectInput
	for i := 0; i < len(projects); i += projectsPerChunk {
		end := i + projectsPerChunk
		if end > len(projects) {
			end = len(projects)
		}
		out = append(out, projects[i:end])
	}
	return out
}
