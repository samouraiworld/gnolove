package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/samouraiworld/topofgnomes/server/models"
)

// ParseReportData unmarshals the JSON data field of a report.
func ParseReportData(report models.Report) (map[string]interface{}, error) {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(report.Data), &data); err != nil {
		return nil, err
	}
	return data, nil
}

// FormatReportForDiscord formats an AI report as a Discord-friendly markdown message.
func FormatReportForDiscord(report models.Report, data map[string]interface{}) string {
	var sb strings.Builder
	sb.WriteString("**Weekly Ecosystem Report**\n")
	fmt.Fprintf(&sb, "_Generated on %s_\n\n", report.CreatedAt.Format("January 2, 2006"))

	projects, ok := data["projects"].([]interface{})
	if !ok || len(projects) == 0 {
		sb.WriteString("No project activity this week.\n")
		return sb.String()
	}

	for _, p := range projects {
		proj, ok := p.(map[string]interface{})
		if !ok {
			continue
		}
		name, _ := proj["project_name"].(string)
		summary, _ := proj["summary"].(string)
		if name == "" {
			continue
		}
		fmt.Fprintf(&sb, "**%s**\n", name)
		if summary != "" {
			sb.WriteString(summary)
		}
		sb.WriteString("\n\n")
	}

	sb.WriteString("[Full reports on Memba](https://memba.samourai.app/gnolove/reports)")
	return sb.String()
}

// SendDiscordMessage posts a message to a Discord webhook URL.
func SendDiscordMessage(webhookURL, content string) error {
	payload := map[string]string{"content": content}
	b, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(webhookURL, "application/json", bytes.NewBuffer(b))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("discord webhook returned status %d", resp.StatusCode)
	}
	return nil
}
