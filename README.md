# Gnolove.world ❤️

![Twitter header Gnolove](https://hackmd.io/_uploads/rJENakXRC.png)

## ❤️ Gamified Contributors Experience for Gnomes! ❤️

###  Introduction :

"_At first, there was Bitcoin, out of entropy soup of the greater All. Then, there was Ethereum, which was created in the likeness of Bitcoin, but made Turing complete.
Among these were Tendermint and Cosmos to engineer robust PoS and IBC. Then came Gno upon Cosmos and there spring forth Gnoland, simulated by the Gnomes of the Greater Resistance."_
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

  Required environment variables:

    - `GITHUB_API_TOKEN`: Your GitHub API token. Create one at [https://github.com/settings/tokens](https://github.com/settings/tokens)
    - `NEXT_PUBLIC_REDIRECT_PROXY`: Your redirect proxy. Create one at [https://github.com/settings/applications/new](https://github.com/settings/applications/new)
    - `NEXT_PUBLIC_OAUTH_CLIENT_ID`: Your OAuth client ID. Create one at [https://github.com/settings/applications/new](https://github.com/settings/applications/new)
    - `NEXT_PUBLIC_GNO_CHAIN_ID`: The chain ID of the Gno chain. Default: test5
    - `NEXT_PUBLIC_GHVERIFY_REALM_PATH`: Your GitHub realm path. Default: [https://gno.land/r/demo/ghverify](https://gno.land/r/demo/ghverify)
    - `NEXT_PUBLIC_PROFILE_REALM_PATH`: Your profile realm path. Default: [https://gno.land/r/demo/profile](https://gno.land/r/demo/profile)
    - `NEXT_PUBLIC_API_URL`: The API URL. Default: [http://localhost:3333](http://localhost:3333).

4. Set up and run the server (backend)

  ```bash
  cd server
  cp .env.example .env
  go run .
  ```

  Required environment variables:

    - `GITHUB_API_TOKEN`: Your GitHub API token. Create one at [https://github.com/settings/tokens](https://github.com/settings/tokens)
    - `GITHUB_OAUTH_CLIENT_ID`: Your OAuth client ID. Create one at [https://github.com/settings/applications/new](https://github.com/settings/applications/new)
    - `GITHUB_OAUTH_CLIENT_SECRET`: Your OAuth client secret. Create one at [https://github.com/settings/applications/new](https://github.com/settings/applications/new)
    - `GITHUB_REPOSITORIES`: A list of space-separated Github repositories we'll look for activity on.
    - `GITHUB_OAUTH_REDIRECT_URL`: Your OAuth redirect URL. Default: [http://localhost:5500](http://localhost:5500)
    - `GITHUB_GRAPHQL_ENDPOINT`: Your GitHub GraphQL endpoint. Default: [https://api.github.com/graphql](https://api.github.com/graphql)
    - `GHVERIFY_OWNER_MNEMONIC`: Your GitHub verify owner mnemonic. Create one in Adena
    - `GHVERIFY_REALM_PATH`: Your Gno ghverify realm path.
    - `GOVDAO_REALM_PATH`: Your Gno GovDAO realm path.
    - `GNO_GRAPHQL_ENDPOINT`: The Gno GraphQL endpoint. Default: [https://indexer.test8.testnets.gno.land/graphql/query](https://indexer.test8.testnets.gno.land/graphql/query)

5. Run the client (frontend) in another terminal
   ```bash
   # In main directory
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


