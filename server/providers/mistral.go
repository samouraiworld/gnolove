package providers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
)

type MistralResponse struct {
	ID     string `json:"id"`
	Object string `json:"object"`
	Model  string `json:"model"`
	Usage  struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
	Created int64 `json:"created"`
	Choices []struct {
		Index        int               `json:"index"`
		Message      map[string]string `json:"message"`
		FinishReason string            `json:"finish_reason"`
	} `json:"choices"`
}

const (
	mistralBaseURL      = "https://api.mistral.ai/v1/"
	authorizationHeader = "Authorization"
	contentTypeHeader   = "Content-Type"
	applicationJSON     = "application/json"
)

func setHeaders(req *http.Request, apiKey string) {
	req.Header.Set(authorizationHeader, fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set(contentTypeHeader, applicationJSON)
}

var responseFormatSchema = map[string]interface{}{
	"type":        "object",
	"name":        "BiweeklyGnolandReport",
	"description": "A whimsical and concise bi-weekly report summarizing the activity of the Gnoland ecosystem.",
	"properties": map[string]interface{}{
		"projects": map[string]interface{}{
			"type":        "array",
			"description": "A list of project reports with stylized summaries.",
			"items": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"project_name": map[string]interface{}{
						"type":        "string",
						"description": "The name of the project in the Gnoland ecosystem.",
					},
					"summary": map[string]interface{}{
						"type":        "string",
						"description": "A short, metaphorical summary (one paragraph) describing PRs merged, issues opened, and contributors' actions, with poetic or mythical tone.",
					},
				},
				"required": []string{"project_name", "summary"},
			},
		},
	},
	"required": []string{"projects"},
	"strict":   false,
}

func callMistralAPI(apiKey, systemPrompt, userPrompt string) (string, error) {
	url := fmt.Sprintf("%schat/completions", mistralBaseURL)

	body := map[string]interface{}{
		"model":       "mistral-small-latest",
		"temperature": 0.7,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"response_format": map[string]interface{}{
			"type": "json_schema",
			"json_schema": map[string]interface{}{
				"name":        "string",
				"description": "string",
				"schema":      responseFormatSchema, // Use "schema" instead of "json_schema"
				"strict":      false,
			},
		},
		"safe_prompt": false,
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	setHeaders(req, apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Log the response body for debugging
		var responseBody bytes.Buffer
		_, _ = responseBody.ReadFrom(resp.Body)
		fmt.Printf("Response Body: %s\n", responseBody.String())

		return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var mistralResp MistralResponse
	if err := json.NewDecoder(resp.Body).Decode(&mistralResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	// Extract the message content from the first choice
	if len(mistralResp.Choices) == 0 || mistralResp.Choices[0].Message["content"] == "" {
		return "", errors.New("no valid response message found")
	}

	content := mistralResp.Choices[0].Message["content"]

	return content, nil
}

func AskMistral(systemPrompt, userPrompt string) (string, error) {
	apiKey := os.Getenv("MISTRAL_API_KEY")
	if apiKey == "" {
		return "", errors.New("MISTRAL_API_KEY environment variable is not set")
	}

	return callMistralAPI(apiKey, systemPrompt, userPrompt)
}
