package report

// ProjectReport represents a single project's summary in the report.
type ProjectReport struct {
	Project_name string `json:"project_name"`
	Summary      string `json:"summary"`
}

// GnoReport is the top-level structure for a weekly report.
type GnoReport struct {
	Cycle    string          `json:"cycle"`
	Projects []ProjectReport `json:"projects"`
}
