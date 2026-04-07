package providers

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
)

// OpenRouter uses the OpenAI-compatible /chat/completions endpoint.
// Free models (e.g. Qwen) have no cost on OpenRouter.
const (
	openrouterBaseURL = "https://openrouter.ai/api/v1/"
	openrouterModel   = "qwen/qwen3-235b-a22b:free" // Free tier, large context
)

func callOpenRouterAPI(apiKey, systemPrompt, userPrompt string, outputFormatSchema map[string]interface{}) (string, error) {
	url := fmt.Sprintf("%schat/completions", openrouterBaseURL)

	body := map[string]interface{}{
		"model":       openrouterModel,
		"temperature": 0.7,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": userPrompt},
		},
	}

	// OpenRouter supports response_format for structured output
	if len(outputFormatSchema) > 0 {
		body["response_format"] = map[string]interface{}{
			"type": "json_schema",
			"json_schema": map[string]interface{}{
				"name":   "WeeklyGnolandReport",
				"schema": outputFormatSchema,
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

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", "https://memba.samourai.app")
	req.Header.Set("X-Title", "Gnolove AI Reports")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var buf bytes.Buffer
		_, _ = buf.ReadFrom(resp.Body)
		return "", fmt.Errorf("openrouter returned status %d: %s", resp.StatusCode, buf.String())
	}

	// OpenRouter uses the same response format as OpenAI/Mistral
	var result MistralResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(result.Choices) == 0 || result.Choices[0].Message["content"] == "" {
		return "", errors.New("no valid response from openrouter")
	}

	return result.Choices[0].Message["content"], nil
}

// AskLLM tries OpenRouter first (free), falls back to Mistral if unavailable.
func AskLLM(systemPrompt, userPrompt string, outputFormatSchema map[string]interface{}) (string, error) {
	if key := os.Getenv("OPENROUTER_API_KEY"); key != "" {
		return callOpenRouterAPI(key, systemPrompt, userPrompt, outputFormatSchema)
	}
	if key := os.Getenv("MISTRAL_API_KEY"); key != "" {
		return callMistralAPI(key, systemPrompt, userPrompt, outputFormatSchema)
	}
	return "", errors.New("no AI API key configured (set OPENROUTER_API_KEY or MISTRAL_API_KEY)")
}
