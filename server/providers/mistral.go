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

// Configuration constants for Mistral API
const (
	mistralModel        = "mistral-small-latest"
	mistralBaseURL      = "https://api.mistral.ai/v1/"
	mistralTemperature  = 0.7
	authorizationHeader = "Authorization"
	contentTypeHeader   = "Content-Type"
	applicationJSON     = "application/json"
)

func setHeaders(req *http.Request, apiKey string) {
	req.Header.Set(authorizationHeader, fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set(contentTypeHeader, applicationJSON)
}

func callMistralAPI(apiKey, systemPrompt, userPrompt string, outputFormatSchema map[string]interface{}) (string, error) {
	url := fmt.Sprintf("%schat/completions", mistralBaseURL)

	body := map[string]interface{}{
		"model":       mistralModel,
		"temperature": mistralTemperature,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
		"safe_prompt": false,
	}

	// If a outputFormatSchema is provided, add response_format to the body
	if len(outputFormatSchema) > 0 && outputFormatSchema != nil {
		body["response_format"] = map[string]interface{}{
			"type": "json_schema",
			"json_schema": map[string]interface{}{
				"name":        "string",
				"description": "string",
				"schema":      outputFormatSchema,
			},
		}
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
		var responseBody bytes.Buffer
		_, _ = responseBody.ReadFrom(resp.Body)
		fmt.Printf("Response Body: %s\n", responseBody.String())
		return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var mistralResp MistralResponse
	if err := json.NewDecoder(resp.Body).Decode(&mistralResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(mistralResp.Choices) == 0 || mistralResp.Choices[0].Message["content"] == "" {
		return "", errors.New("no valid mistral response message found")
	}

	content := mistralResp.Choices[0].Message["content"]

	return content, nil
}

func AskMistral(systemPrompt, userPrompt string, outputFormatSchema map[string]interface{}) (string, error) {
	apiKey := os.Getenv("MISTRAL_API_KEY")
	if apiKey == "" {
		return "", errors.New("MISTRAL_API_KEY environment variable is not set")
	}

	return callMistralAPI(apiKey, systemPrompt, userPrompt, outputFormatSchema)
}
