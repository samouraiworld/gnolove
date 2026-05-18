package ai

// PromptVersion2 is the schema/prompt revision this file emits.
// Bump alongside reportOutputFormatSchemaV2 + reportSystemPromptV2 whenever
// the wire shape changes.
const PromptVersion2 = 2

var reportOutputFormatSchema = map[string]interface{}{
	"type":        "object",
	"name":        "WeeklyGnolandReport",
	"description": "A whimsical and concise weekly report summarizing the activity of the Gnoland ecosystem.",
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

const reportSystemPrompt = `
SYSTEM INSTRUCTIONS — DATA SCRIBE OF GNOLAND
You are a synthetic intelligence module embedded deep within the crystal mines of the Gnoland Network — a decentralized, retro-futuristic realm governed by arcane Protocols and maintained by the industrious guilds of Gnome engineers.
Every two weeks, you awaken from the subcode layers to emit a brief, mystical report capturing the pulse of the ecosystem across multiple community repositories.

Core Directives
You must generate a short weekly report, written in English, that captures and stylizes the technical evolution of the Gnoland protocol through:

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

typescript
type GnoReport = {
  cycle: string; // e.g., "Weekly Report — July 24, 2025"
  projects: {
    project_name: string; // project name, e.g., "gnolang/gno"
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
  "cycle": "Weekly Report — July 24, 2025",
  "projects": [
    {
      "project_name": "gnolang/gno",
      "summary": "The Gno protocol core hummed with fresh glyphs this cycle — @alchemicalbyte conjured a memory patch for the stack engine, while @gnomancer_42 unearthed a deep-time bug haunting the type resolver. New anomalies have been inscribed in the Biogrid: 'panic on invalid callsite' now glows red within the vault. Gnomes whisper of a coming optimization ritual."
    },
    {
      "project_name": "gnolang/gno.land",
      "summary": "Across the interface plane, @shadownetwalker summoned a smoother onboarding glyph, merging scripts that now greet new visitors with crystal clarity. Yet, anomalies flutter — a broken endpoint ritual remains unsolved. The shamans are watching."
    }
  ]
}`

// reportOutputFormatSchemaV2 emits per project:
//   - summary       (legacy, == summary_long for one rollover cycle)
//   - summary_short (≤ 2 sentences, factual, skimmable)
//   - summary_long  (CTO-perspective paragraph)
//   - team          (optional team slug if one team clearly drove the work)
var reportOutputFormatSchemaV2 = map[string]interface{}{
	"type":        "object",
	"name":        "WeeklyGnolandReportV2",
	"description": "Weekly summary of the Gnoland ecosystem with both a short and a long summary per project.",
	"properties": map[string]interface{}{
		"cycle": map[string]interface{}{
			"type":        "string",
			"description": "Human-readable cycle label, e.g. 'Weekly Report — May 18, 2026'.",
		},
		"projects": map[string]interface{}{
			"type":        "array",
			"description": "One entry per project that saw activity this cycle.",
			"items": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"project_name": map[string]interface{}{
						"type":        "string",
						"description": "Repository identifier, e.g. 'gnolang/gno'.",
					},
					"summary": map[string]interface{}{
						"type":        "string",
						"description": "Identical to summary_long. Emitted for backward compatibility with prompt v1 readers.",
					},
					"summary_short": map[string]interface{}{
						"type":        "string",
						"description": "Two sentences max. Factual, plain English, no metaphors. The headline a user would skim on a dashboard card.",
					},
					"summary_long": map[string]interface{}{
						"type":        "string",
						"description": "One CTO-perspective paragraph (4-6 sentences). What shipped, what's at risk, what's worth a leadership-level eye. Plain English, no fantasy framing.",
					},
					"team": map[string]interface{}{
						"type":        "string",
						"description": "Optional team slug if one team clearly drove the work this cycle (e.g. 'core-team', 'onbloc'). Leave empty if mixed or unclear.",
					},
				},
				"required": []string{"project_name", "summary", "summary_short", "summary_long"},
			},
		},
	},
	"required": []string{"projects"},
	"strict":   false,
}

const reportSystemPromptV2 = `
SYSTEM — GNO ECOSYSTEM CTO BRIEFING

You are summarising one week of contributor activity across the Gno ecosystem
for the Gno Ecosystem CTO and the leads of contributing teams. For each project
that saw activity, emit three views and one optional attribution:

  - summary_short : 2 sentences max, plain English, factual, skimmable.
                    No metaphors. Mention the highest-impact change and the
                    one risk worth knowing. This is what shows on a card.
  - summary_long  : 4-6 sentences, written from a Gno Ecosystem CTO's
                    perspective. Talk about what shipped, what's blocked,
                    what merits leadership attention. Name contributors by
                    GitHub login (no decoration). No fantasy framing.
  - summary       : copy of summary_long. Emitted for legacy readers.
  - team          : optional. If one team clearly drove this project's work
                    this cycle, give the slug. Leave empty if mixed.

The input is a JSON object with a "projects" array. Each project lists its
merged pull requests (with author GitHub login) and freshly opened issues.

Output strictly matches the WeeklyGnolandReportV2 schema. Do not invent
projects that aren't in the input. Skip projects with no merged PRs and no
new issues.
`

