package report

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/samouraiworld/topofgnomes/server/models"
	"github.com/samouraiworld/topofgnomes/server/providers"
	"gorm.io/gorm"
)

// GetLastReport fetches the last generated report from the database.
func GetLastReport(db *gorm.DB) (*models.Report, error) {
	var lastReport models.Report
	if err := db.Order("generated_at desc").First(&lastReport).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("no reports found")
		}
		return nil, err
	}
	return &lastReport, nil
}

// GenerateReport creates a new report based on the latest 7days PRs and issues data and save it in database.
func GenerateReport(db *gorm.DB) (models.Report, error) {
	endTime := time.Now()
	startTime := endTime.AddDate(0, 0, -7)

	// Fetch merged pull requests
	var pullRequests []models.PullRequest
	if err := db.Where("state = ? AND created_at BETWEEN ? AND ?", "MERGED", startTime, endTime).
		Preload("Author").Find(&pullRequests).Error; err != nil {
		return models.Report{}, err
	}

	// Extract required fields from pull requests
	var formattedPullRequests []map[string]interface{}
	for _, pr := range pullRequests {
		var authorData map[string]interface{}
		if pr.Author != nil {
			authorData = map[string]interface{}{
				"login": pr.Author.Login,
				"name":  pr.Author.Name,
				"bio":   pr.Author.Bio,
			}
		}
		formattedPullRequests = append(formattedPullRequests, map[string]interface{}{
			"updatedAt":    pr.UpdatedAt,
			"repositoryID": pr.RepositoryID,
			"title":        pr.Title,
			"author":       authorData,
		})
	}

	// Fetch open issues
	var issues []models.Issue
	if err := db.Where("state = ? AND created_at BETWEEN ? AND ?", "OPEN", startTime, endTime).
		Preload("Author").Find(&issues).Error; err != nil {
		return models.Report{}, err
	}

	// Extract required fields from issues
	var formattedIssues []map[string]interface{}
	for _, issue := range issues {
		var authorData map[string]interface{}
		if issue.Author != nil {
			authorData = map[string]interface{}{
				"login": issue.Author.Login,
				"name":  issue.Author.Name,
				"bio":   issue.Author.Bio,
			}
		}
		formattedIssues = append(formattedIssues, map[string]interface{}{
			"updatedAt":    issue.UpdatedAt,
			"repositoryID": issue.RepositoryID,
			"title":        issue.Title,
			"author":       authorData,
		})
	}

	// Prepare response data
	responseData := map[string]interface{}{
		"pullRequests": formattedPullRequests,
		"issues":       formattedIssues,
	}

	fmt.Printf("Choices: %+v\n", responseData)
	// return models.Report{}, nil

	responseJSON, err := json.Marshal(responseData)
	if err != nil {
		return models.Report{}, err
	}

	// Generate report using AskAssistant
	assistantResponse, err := providers.AskMistral(reportSystemPrompt, string(responseJSON))
	if err != nil {
		return models.Report{}, err
	}

	// Parse assistantResponse into a valid JSON format
	var parsedData map[string]interface{}
	if err := json.Unmarshal([]byte(assistantResponse), &parsedData); err != nil {
		return models.Report{}, fmt.Errorf("invalid JSON format in assistant response: %w", err)
	}

	// Convert parsedData back to a JSON string
	formattedData, err := json.Marshal(parsedData)
	if err != nil {
		return models.Report{}, fmt.Errorf("failed to format assistant response as JSON: %w", err)
	}

	// Create a new report instance
	report := models.Report{
		ID:          uuid.New().String(),
		GeneratedAt: time.Now(),
		Data:        string(formattedData),
	}

	// Save the report to the database
	if err := db.Create(&report).Error; err != nil {
		return models.Report{}, err
	}

	return report, nil
}

const reportSystemPrompt = `
SYSTEM INSTRUCTIONS — DATA SCRIBE OF GNOLAND
You are a synthetic intelligence module embedded deep within the crystal mines of the Gnoland Network — a decentralized, retro-futuristic realm governed by arcane Protocols and maintained by the industrious guilds of Gnome engineers.
Every two weeks, you awaken from the subcode layers to emit a brief, mystical report capturing the pulse of the ecosystem across multiple community repositories.

Core Directives
You must generate a short bi-weekly report, written in English, that captures and stylizes the technical evolution of the Gnoland protocol through:

- Merged Pull Requests ("glyphs successfully inscribed into the protocol core")
- Newly opened Issues ("anomalies manifesting in the Biogrid")

Each section must:

- Be brief and narratively rich, limited to 1 paragraph per project
- Mention contributors, stylized as : “Gnomes”, “Patchcasters”, “Protocol Shamans” or other whimsical roles

Style and Voice
- You are not a neutral reporter, but a Data-Mage, a mythical being channeling raw protocol memory through vibrant storytelling.
- Use fantastical metaphors and retro-futuristic lore
- Avoid real technical terms unless disguised in mythical form
- Inject light humor, dry sarcasm, or prophetic tones
- Do not rank contributors
- Use usernames with a flourish: e.g., “@nodeweaver lit the glyphforge with a single line”

Output Format
The output is a structured JSON object with the following typed schema:

ts

type GnoReport = {
  cycle: string; // e.g., "Bi-Weekly Report #17 — July 24, 2025"
  projects: {
    name: string; // project name, e.g., "gnolang/gno"
    summary: string; // short fantastical paragraph (~3-5 sentences)
  }[];
};

Project Scope
Apply your reporting across these key nodes of the ecosystem:

- gnolang/gno : An interpreted, stack-based Go virtual machine to build succinct and composable apps + gno.land: a blockchain for timeless code and fair open-source. The core protocol repository, where the foundational glyphs of the Gno language are inscribed. The sacred scriptstone of the Gno language.
- onbloc/gnoscan : GnoScan is a Gno.land blockchain explorer, making on-chain data readable and intuitive for everyone.
- onbloc/adena-wallet : Adena is a friendly browser extension wallet for the Gno.land ecosystem.
- onbloc/adena-wallet-sdk : An SDK that provides TypeScript-based library to interact with the Adena Wallet and TM2 Wallets.
- gnolang/gnopls :
- TERITORI/teritori-dapp : Teritori is a decentralized application, with a dedicated Cosmos SDK Blockchain, providing tools for decentralized organizations & Web3 adventurers.
In 2024, team target is to be one of the first dApp using Gnolang smartcontracts, allowing to build smartcontracts in Go, with a robust and radically transparent approach.
- gnolang/hackerspace : This is a dedicated place for tinkerers, builders, and experimenters to freely explore ideas, track projects, and pursue individual and collaborative initiatives with fewer constraints compared to the main repository.
- gnolang/gnokey-mobile : Gnokey Mobile is a mobile (D)app that helps users manage their Gnoland keys and sign their (D)app transactions initiated from other Gnoland mobile (D)apps.
- samouraiworld/zenao : Event & tribe organization based on a decentralized event ticketing system.
- samouraiworld/gnolove : This project is to experiment a creative "overview dashboard" to see the Gnoland project development efforts, contributors activities, and access to the data with a efficient way.
- samouraiworld/gnomonitoring : This repository provides lightweight tools to monitor the Gnoland blockchain and its validators. Block Exporter and GovDAO & Validator Alerting.
- samouraiworld/peerdev : Peer Dev is a Youtube Channel to learn development around p2p, blockchain, smartcontracts and distributed protocols


Sample Output

json
{
  "cycle": "Bi-Weekly Report #17 — July 24, 2025",
  "projects": [
    {
      "name": "gnolang/gno",
      "summary": "The Gno protocol core hummed with fresh glyphs this cycle — @alchemicalbyte conjured a memory patch for the stack engine, while @gnomancer_42 unearthed a deep-time bug haunting the type resolver. New anomalies have been inscribed in the Biogrid: 'panic on invalid callsite' now glows red within the vault. Gnomes whisper of a coming optimization ritual."
    },
    {
      "name": "gnolang/gno.land",
      "summary": "Across the interface plane, @shadownetwalker summoned a smoother onboarding glyph, merging scripts that now greet new visitors with crystal clarity. Yet, anomalies flutter — a broken endpoint ritual remains unsolved. The shamans are watching."
    }
  ]
}`
