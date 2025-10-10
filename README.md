# Gnolove.world ❤️

![Twitter header Gnolove](https://hackmd.io/_uploads/rJENakXRC.png)

## ❤️ Gamified Contributors Experience for Gnomes! ❤️

###  Introduction :

"_At first, there was Bitcoin, out of entropy soup of the greater All. Then, there was Ethereum, which was created in the likeness of Bitcoin, but made Turing complete.
Among these were Tendermint and Cosmos to engineer robust PoS and IBC. Then came Gno upon Cosmos and there spring forth Gnoland, simulated by the Gnomes of the Greater Resistance._"
Gno is an interpreted and fully-deterministic implementation of the Go programming language, designed to build succinct and composable smart contracts. The first blockchain to use it is gno.land, a Proof of Contribution-based chain, backed by a variation of the Tendermint consensus engine.

In the future, contributors will be paid automatically for their contributions on the blockchain project, using different data prodivers prooving valuable contributions, and a decentralized reviewing organization.

### Gnolove
Gnolove is a scoreboard for the Gno chain that showcases contributors, open‑source repositories, activity and development efforts across the Gnoland ecosystem. Our aim is to make all this data in easily accessible.

Main goals right now are : 
- boost developers motivation to join the movement! 🏆
- create a fun community experience! 🥇
- offer an alternative option to visualize activity! 📊
- experiment! 🧰

---

### Features
- Overview of Gnoland development efforts
- Leaderboard of top contributors, through calculating love power.
- Weekly pull request report for each team and each repository
- Ability to view and vote on proposals as GovDAO member
- Ability to view and manage Gno validators
- Visual contributor activity (commits, issues, pull requests, reviews) tracking and timeline
- Gno-related tutorial videos
- Ability to set up webhooks to periodically receive leaderboards in Discord or Slack

#### Ideas for future
- Offer goodies to top contributors every month, claiming their rewards: www.samourai.fun
- Generate automatically some dev reports to enforce information transparency for non-tech communities
- Connect it to a newsletter to receive a monthly gno dev report
- ... 🧠 'enter your ideas'

#### Source:
https://github.com/gnolang/gno

---

# Getting started
1. Clone the repository
   ```bash
   git clone https://github.com/samouraiworld/gnolove.git
   cd ./gnolove
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```

 - Frontend environment variables

   - Required:
     - `GITHUB_API_TOKEN`: Your GitHub API token. Create one at [https://github.com/settings/tokens](https://github.com/settings/tokens)
     - `NEXT_PUBLIC_API_URL`: The API (backend) URL

   - Optional:
     - `NEXT_PUBLIC_MONITORING_API_URL`: enables monitoring/validators features.
     - `YOUTUBE_API_KEY`: enables YouTube tutorials
     - `NEXT_PUBLIC_GNO_CHAIN_ID`: used by Adena network checks when linking GitHub profile
     - `NEXT_PUBLIC_OAUTH_CLIENT_ID` and `NEXT_PUBLIC_REDIRECT_PROXY`: GitHub OAuth linking 
     - `NEXT_PUBLIC_GHVERIFY_REALM_PATH`: on‑chain verification UX
     - `NEXT_PUBLIC_PROFILE_REALM_PATH`: on‑chain profile updates
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: front‑end part of Clerk; pairs with backend `CLERK_SECRET_KEY`

  ```bash
  cd server
  cp .env.example .env
  ```

 - Backend environment variables

   - Required:
     - `GITHUB_REPOSITORIES`: A list of space-separated GitHub repositories we'll look for activity on.
     - `GITHUB_OAUTH_CLIENT_ID`: Your OAuth client ID. Create one at [https://github.com/settings/applications/new](https://github.com/settings/applications/new)
     - `GITHUB_OAUTH_CLIENT_SECRET`: Your OAuth client secret. Create one at [https://github.com/settings/applications/new](https://github.com/settings/applications/new)
     - `GITHUB_API_TOKEN`: Your GitHub API token. Create one at [https://github.com/settings/tokens](https://github.com/settings/tokens)
     - `GNO_RPC_ENDPOINT`: Your Gno RPC endpoint. Used by RPC client and on‑chain code
     - `GNO_GRAPHQL_ENDPOINT`: Your Gno GraphQL endpoint. Used by Gno indexer client
     - `GNO_CHAIN_ID`: The Gno chain ID. Used by signer
     - `GHVERIFY_OWNER_MNEMONIC`: Your GitHub verify owner mnemonic. Create one in Adena.
     - `GHVERIFY_REALM_PATH`: Your Gno ghverify realm path. Used by signer
     - `GOVDAO_REALM_PATH`: Your Gno GovDAO realm path. Used by signer

   - Optional with defaults:
     - `DATABASE_PATH`: The database path. Defaults to `db/database.db`.
     - `LEADERBOARD_EXCLUDED_REPOS`: The repositories excluded when we calculate activity to compute leaderboards, sent through webhooks. Defaults to `samouraiworld/gnomonitoring`

   - Optional (no defaults in code; enable extra features when provided):
     - `DISCORD_WEBHOOK_URL`: URL for the Samourai Coop Discord webhook in which we send leaderboards. Deprecated.
     - `CLERK_SECRET_KEY`: Enables Clerk‑protected features
     - `MISTRAL_API_KEY`: Enables scheduled AI tasks

4. Run the server (backend)
   ```bash
   cd server
   go run .
   ```

5. Run the client (frontend) in another terminal
   ```bash
   cd ..
   pnpm run dev
   ```

---

#### Current Love Power Equation: 

| Contribution Type | Points |
|-------------------|--------| 
| PR                | 2      | 
| Review done       | 2      | 
| Issue opened      | 0,5    | 
| Commit            | 10     | 

---

### Contribute

We welcome contributions from the community! 
Check out our [contribution guide](CONTRIBUTING.md) to get started.

👉 [Contribute to the project](https://github.com/samouraiworld/gnolove)

---

To be continued, 
by & for Gno.land community.
🥷


