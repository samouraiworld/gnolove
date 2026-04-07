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
// Free models are tried in order — if one is rate-limited, the next is attempted.
const openrouterBaseURL = "https://openrouter.ai/api/v1/"

// Free models tried first, then low-cost paid model as final fallback.
// Order matters: cheapest/most-available first.
var openrouterFreeModels = []string{
	"qwen/qwen3.6-plus:free",                   // Qwen 3.6 Plus — large context
	"meta-llama/llama-3.3-70b-instruct:free",    // Llama 3.3 70B
	"google/gemma-3-27b-it:free",                // Gemma 3 27B
	"nousresearch/hermes-3-llama-3.1-405b:free", // Hermes 3 405B
}

// Paid fallback — very cheap ($0.08/M input, $0.20/M output).
// A single weekly report costs ~$0.001.
const openrouterPaidModel = "qwen/qwen3-30b-a3b"

func callOpenRouterWithModel(apiKey, model, systemPrompt, userPrompt string, outputFormatSchema map[string]interface{}) (string, error) {
	url := fmt.Sprintf("%schat/completions", openrouterBaseURL)

	body := map[string]interface{}{
		"model":       model,
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

	if resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode == http.StatusServiceUnavailable {
		return "", fmt.Errorf("model %s rate-limited (status %d)", model, resp.StatusCode)
	}

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

func callOpenRouterAPI(apiKey, systemPrompt, userPrompt string, outputFormatSchema map[string]interface{}) (string, error) {
	var lastErr error

	// Try free models first
	for _, model := range openrouterFreeModels {
		result, err := callOpenRouterWithModel(apiKey, model, systemPrompt, userPrompt, outputFormatSchema)
		if err == nil {
			fmt.Printf("[OpenRouter] report generated with free model %s\n", model)
			return result, nil
		}
		lastErr = err
		fmt.Printf("[OpenRouter] free model %s failed: %v, trying next...\n", model, err)
	}

	// Final fallback: low-cost paid model
	fmt.Printf("[OpenRouter] all free models exhausted, trying paid fallback %s\n", openrouterPaidModel)
	result, err := callOpenRouterWithModel(apiKey, openrouterPaidModel, systemPrompt, userPrompt, outputFormatSchema)
	if err == nil {
		fmt.Printf("[OpenRouter] report generated with paid model %s\n", openrouterPaidModel)
		return result, nil
	}
	lastErr = err

	return "", fmt.Errorf("all OpenRouter models failed (free + paid), last error: %w", lastErr)
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
