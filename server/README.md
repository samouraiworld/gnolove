# Gnolove Server

This server will index all the commits, pull requests, issues, reviews, contributors, etc on gno-ecosystem repositories.


### How to launch the service

Prerequisites: 
- Golang > 1.24.0

```sh
## On Mac
brew install go
## On Linux
sudo apt-get install go
```

- Create a `.env` file in the `/server` folder with the following variables:

| Variable Name               | Required | Example / Description                                                  |
|----------------------------|----------|-----------------------------------------------------------------------|
| GITHUB_API_TOKEN           | Yes      | GitHub API token for authentication                                   |
| GITHUB_GRAPHQL_ENDPOINT    | Yes      | GitHub GraphQL endpoint (commonly: https://api.github.com/graphql)    |
| GNO_GRAPHQL_ENDPOINT       | Yes      | Gno blockchain GraphQL endpoint                                       |
| GNO_RPC_ENDPOINT           | Yes      | Gno blockchain RPC endpoint                                           |
| GITHUB_OAUTH_CLIENT_ID     | Yes      | Your GitHub OAuth App Client ID                                       |
| GITHUB_OAUTH_CLIENT_SECRET | Yes      | Your GitHub OAuth App Client Secret                                   |
| GITHUB_REPOSITORIES        | Yes      | Space-separated list of repositories in the format owner/name/branch   |
| GHVERIFY_OWNER_MNEMONIC    | Yes      | Mnemonic for signature verification (for linking GitHub & wallet)      |
| GNO_CHAIN_ID               | Yes      | Gno blockchain chain ID                                               |
| DISCORD_WEBHOOK_URL        | No       | Discord webhook for leaderboard notifications                         |

See `.env.example` if present for more details.



```sh
## on server folder
go run .
issues: All updated exiting...
pullRequests: All updated
Server running on port 3333
```
This command will start indexing all important elements on the repository then starting serving the api:

### API Endpoints

#### Contributors & Users

- **Get all users**  
  `GET /users`  
  Returns all users. Add an optional list of addresses to filter by.

  | Parameter | In   | Type   | Required | Description                    |
  |-----------|------|--------|----------|--------------------------------|
  | address   | query | string | No      | Wallet address                 |

- **Get user by address**  
  `GET /users/{address}`  
  Returns detailed profile and contribution stats for a specific GitHub user.

  | Parameter | In   | Type   | Required | Description                    |
  |-----------|------|--------|----------|--------------------------------|
  | address   | path | string | Yes      | Wallet address                 |

- **Get contributor by login**  
  `GET /contributors/{login}`  
  Returns detailed profile and contribution stats for a specific GitHub user.

  | Parameter | In   | Type   | Required | Description                    |
  |-----------|------|--------|----------|--------------------------------|
  | login     | path | string | Yes      | GitHub username/login          |

- **Get newest contributors**  
  `GET /contributors/newest?number=N`  
  Returns the N most recently joined contributors.

  | Parameter | In    | Type   | Required | Description                             |
  |-----------|-------|--------|----------|-----------------------------------------|
  | number    | query | int    | No       | Number of contributors to return (default: 5) |

#### Stats & Scoring

- **Get contributor stats**  
  `GET /stats?time=period[&exclude=login1,login2][&repositories=repo1,repo2]`  
  Returns statistics for contributors.

  | Parameter    | In    | Type   | Required | Description                                                        |
  |--------------|-------|--------|----------|--------------------------------------------------------------------|
  | time         | query | string | No       | Time period: `daily`, `weekly`, `monthly`, or `yearly`. If omitted, returns all-time stats (no explicit all time value). |
  | exclude      | query | string | No       | Comma-separated logins to exclude                                  |
  | repositories | query | string | No       | Comma-separated repository IDs (owner/name)                        |

- **Get score factors**  
  `GET /score-factors`  
  Returns the weights used for score calculation.

  _No parameters._

#### Issues & Repositories

- **Get issues**  
  `GET /issues?labels=label1,label2[&repositories=repo1,repo2]`  
  Returns issues, optionally filtered by labels and repositories.

  | Parameter    | In    | Type   | Required | Description                                                         |
  |--------------|-------|--------|----------|---------------------------------------------------------------------|
  | labels       | query | string | No       | Comma-separated list of label names                                 |
  | repositories | query | string | No       | Comma-separated repository IDs (owner/name)                         |

- **Get repositories**  
  `GET /repositories`  
  Returns all tracked repositories.

  _No parameters._

#### Pull Requests

- **Get pull requests report**  
  `GET /pull-requests/report`  
  Returns a report of pull requests, optionally filtered by repositories.

  | Parameter    | In    | Type   | Required | Description                                                         |
  |--------------|-------|--------|----------|---------------------------------------------------------------------|
  | repositories | query | string | No       | Comma-separated repository IDs (owner/name)                         |
  | startDate    | query | string | No       | Start date (RFC3339 or YYYY-MM-DD)                                  |
  | endDate      | query | string | No       | End date (RFC3339 or YYYY-MM-DD)                                    |

#### Milestones

- **Get milestone**  
  `GET /milestones/{number}`  
  Returns details for the specified milestone.

  | Parameter | In   | Type | Required | Description                 |
  |-----------|------|------|----------|-----------------------------|
  | number    | path | int  | Yes      | Milestone number (GitHub)   |

#### GitHub OAuth & Linking

- **Exchange GitHub OAuth code for user and token**  
  `GET /github/oauth/exchange?code=OAUTH_CODE`  
  Exchanges an OAuth code for a GitHub user and access token.

  | Parameter | In    | Type   | Required | Description                  |
  |-----------|-------|--------|----------|------------------------------|
  | code      | query | string | Yes      | GitHub OAuth code            |

- **Verify GitHub account**  
  `GET /github/verify?token=TOKEN&login=LOGIN&address=ADDRESS`  
  Verifies that a GitHub login belongs to a user and links it to a wallet address.

  | Parameter | In    | Type   | Required | Description                    |
  |-----------|-------|--------|----------|--------------------------------|
  | token     | query | string | Yes      | GitHub access token            |
  | login     | query | string | Yes      | GitHub username/login          |
  | address   | query | string | Yes      | Wallet address to link         |

- **Link GitHub account to wallet**  
  `POST /github/link`  
  Body: `{ "address": "...", "login": "..." }`  
  Links a wallet address to a GitHub login.

  | Field   | In   | Type   | Required | Description           |
  |---------|------|--------|----------|-----------------------|
  | address | body | string | Yes      | Wallet address        |
  | login   | body | string | Yes      | GitHub username/login |

#### On-chain (Gno) Endpoints

- **Get all Gno namespaces**  
  `GET /onchain/namespaces`  
  Returns all registered namespaces.

  _No parameters._

- **Get namespaces by user**  
  `GET /onchain/namespaces/{address}`  
  Returns namespaces registered by a specific address.

  | Parameter | In   | Type   | Required | Description             |
  |-----------|------|--------|----------|-------------------------|
  | address   | path | string | Yes      | Wallet address (bech32) |

- **Get all Gno packages**  
  `GET /onchain/packages`  
  Returns all registered packages.

  _No parameters._

- **Get packages by user**  
  `GET /onchain/packages/{address}`  
  Returns packages published by a specific address.

  | Parameter | In   | Type   | Required | Description             |
  |-----------|------|--------|----------|-------------------------|
  | address   | path | string | Yes      | Wallet address (bech32) |
- **Get proposals**  
  `GET /onchain/proposals`  
  Returns all registered proposals.

  | Parameter | In   | Type   | Required | Description             |
  |-----------|------|--------|----------|-------------------------|
  | address   | query | string | No      | Wallet address (bech32) |

- **Get proposal by id**  
  `GET /onchain/proposals/{id}`  
  Returns a specific proposal.

  | Parameter | In   | Type   | Required | Description             |
  |-----------|------|--------|----------|-------------------------|
  | id        | path | string | Yes      | Proposal ID             |

- **Get govdao members**  
  `GET /onchain/govdao-members`  
  Returns all registered govdao members.

  _No parameters._

#### Leaderboard Webhooks
These requests are user-scoped and therefore need to be authenticated with a Clerk token. They will return 401s if they're not authenticated.
- **Get leaderboard webhooks**  
  `GET /leaderboard-webhooks`  
  Returns all leaderboard webhooks.

  _No parameters._

- **Create leaderboard webhook**  
  `POST /leaderboard-webhooks`  
  Body: `{ "url": "...", "type": "discord", "frequency": "daily", "day": 0, "hour": 0, "minute": 0, "timezone": "UTC", "repositories": ["..."], "active": true }`  
  Creates a new leaderboard webhook.

  | Field   | In   | Type   | Required | Description           |
  |---------|------|--------|----------|-----------------------|
  | url     | body | string | Yes      | Webhook URL           |
  | type    | body | string | Yes      | Webhook type (discord, slack) |
  | frequency | body | string | Yes      | Webhook frequency (daily, weekly) |
  | day     | body | int    | No       | Day of the week (0=Sunday, 6=Saturday) for weekly frequency |
  | hour    | body | int    | Yes      | Hour of the day (0-23) |
  | minute  | body | int    | Yes      | Minute of the hour (0-59) |
  | timezone | body | string | Yes      | Timezone (e.g. "America/New_York") |
  | repositories | body | string | No       | Comma-separated repository IDs (owner/name) |

- **Update leaderboard webhook**  
  `PUT /leaderboard-webhooks/{id}`  
  Body: `{ "url": "...", "type": "discord", "frequency": "daily", "day": 0, "hour": 0, "minute": 0, "timezone": "UTC", "repositories": ["..."], "active": true }`  
  Updates an existing leaderboard webhook.

  | Field   | In   | Type   | Required | Description           |
  |---------|------|--------|----------|-----------------------|
  | url     | body | string | Yes      | Webhook URL           |
  | type    | body | string | Yes      | Webhook type (discord, slack) |
  | frequency | body | string | Yes      | Webhook frequency (daily, weekly) |
  | day     | body | int    | No       | Day of the week (0=Sunday, 6=Saturday) for weekly frequency |
  | hour    | body | int    | Yes      | Hour of the day (0-23) |
  | minute  | body | int    | Yes      | Minute of the hour (0-59) |
  | timezone | body | string | Yes      | Timezone (e.g. "America/New_York") |
  | repositories | body | string | No       | Comma-separated repository IDs (owner/name) |
  | active  | body | bool   | Yes      | Whether the webhook is active |

- **Delete leaderboard webhook**  
  `DELETE /leaderboard-webhooks/{id}`  
  Deletes an existing leaderboard webhook.

#### Reports endpoints

- **Get Latest Report**
  `GET ai/report`
  Returns the latest weekly report for the Gnoland ecosystem, formatted as a JSON object.

  _No parameters._

  **Response Example:**

  ```json
  {
    "cycle": "weekly Report #17 — July 24, 2025",
    "projects": [
      {
        "name": "gnolang/gno",
        "summary": "The ancient scriptstone of Gno hummed with activity this cycle..."
      }
    ]
  }
  ```

- **Get Report by Date Range**
  `GET ai/reports/weekly?start=YYYY-MM-DDTHH:MM:SSZ&end=YYYY-MM-DDTHH:MM:SSZ`
  Returns the report for a specific date range (usually a week period). Dates must be in RFC3339 format.

  **Query Parameters:**
  | Name | Required | Description |
  |-------|----------|----------------------------|
  | start | Yes | Start date (RFC3339) |
  | end | Yes | End date (RFC3339) |

  **Response Example:**
  Same as above.
---

**Notes:**
- All endpoints return JSON.
- Some endpoints accept additional query params for filtering.
- See handler code for full response shape.

---

## Database Models

### User
| Field            | Type      | Description                                    |
|------------------|-----------|------------------------------------------------|
| ID               | string    | Primary key, user ID (GitHub)                  |
| Login            | string    | GitHub username/login                          |
| AvatarUrl        | string    | GitHub avatar URL                              |
| URL              | string    | GitHub profile URL                             |
| Name             | string    | Display name                                   |
| Wallet           | string    | Linked wallet address                          |
| Bio              | string    | User bio                                       |
| Location         | string    | User location                                  |
| JoinDate         | time.Time | Date joined GitHub                             |
| WebsiteUrl       | string    | Personal website URL                           |
| TwitterUsername  | string    | Twitter handle                                 |
| TotalStars       | int       | Total stars received                           |
| TotalRepos       | int       | Total public repositories                      |
| Followers        | int       | Number of followers                            |
| Following        | int       | Number of following                            |
| TopRepositories  | string    | JSON string of top repositories                |
| Issues           | []Issue   | Issues authored by user                        |
| PullRequests     | []PullRequest | Pull requests authored by user             |
| Reviews          | []Review  | Reviews authored by user                       |
| Commits          | []Commit  | Commits authored by user                       |

### Repository
| Field      | Type   | Description                  |
|------------|--------|-----------------------------|
| ID         | string | Primary key, repo ID        |
| Name       | string | Repository name             |
| Owner      | string | Repository owner            |
| BaseBranch | string | Default branch (e.g., main) |

### Commit
| Field        | Type      | Description                         |
|--------------|-----------|-------------------------------------|
| ID           | string    | Primary key, commit ID              |
| CreatedAt    | time.Time | Commit creation time                |
| UpdatedAt    | time.Time | Last update time                    |
| AuthorID     | string    | Foreign key to User                 |
| Title        | string    | Commit message/title                |
| URL          | string    | Commit URL                          |
| Author       | *User     | Author (user struct)                |
| RepositoryID | string    | Foreign key to Repository           |

### PullRequest
| Field        | Type        | Description                              |
|--------------|-------------|------------------------------------------|
| ID           | string      | Primary key, PR ID                       |
| CreatedAt    | time.Time   | PR creation time                         |
| UpdatedAt    | time.Time   | Last update time                         |
| RepositoryID | string      | Foreign key to Repository                |
| Number       | int         | PR number (GitHub)                       |
| State        | string      | State (e.g., open, closed, merged)       |
| Title        | string      | PR title                                 |
| AuthorID     | string      | Foreign key to User                      |
| Author       | *User       | Author (user struct)                     |
| Reviews      | []Review    | Reviews on this PR                       |
| MilestoneID  | string      | Foreign key to Milestone                 |
| URL          | string      | PR URL                                   |

### Issue
| Field        | Type        | Description                              |
|--------------|-------------|------------------------------------------|
| ID           | string      | Primary key, issue ID                    |
| CreatedAt    | time.Time   | Issue creation time                      |
| UpdatedAt    | time.Time   | Last update time                         |
| RepositoryID | string      | Foreign key to Repository                |
| Number       | int         | Issue number (GitHub)                    |
| State        | string      | State (e.g., open, closed)               |
| Title        | string      | Issue title                              |
| AuthorID     | string      | Foreign key to User                      |
| Author       | *User       | Author (user struct)                     |
| Labels       | []Label     | Labels on the issue                      |
| MilestoneID  | string      | Foreign key to Milestone                 |
| URL          | string      | Issue URL                                |
| Assignees    | []Assignee  | Assignees on the issue                   |

#### Label (for Issue)
| Field | Type   | Description      |
|-------|--------|-----------------|
| ID    | uint   | Primary key     |
| Name  | string | Label name      |
| Color | string | Label color     |

#### Assignee (for Issue)
| Field   | Type   | Description              |
|---------|--------|-------------------------|
| ID      | uint   | Primary key             |
| UserID  | string | Foreign key to User     |
| IssueID | string | Foreign key to Issue    |
| User    | *User  | User struct             |

### Milestone
| Field        | Type        | Description                              |
|--------------|-------------|------------------------------------------|
| ID           | string      | Primary key, milestone ID                 |
| RepositoryID | string      | Foreign key to Repository                 |
| CreatedAt    | time.Time   | Milestone creation time                   |
| UpdatedAt    | time.Time   | Last update time                          |
| Number       | int         | Milestone number (GitHub)                 |
| Title        | string      | Milestone title                           |
| State        | string      | State (open/closed)                       |
| AuthorID     | string      | Foreign key to User                       |
| Author       | User        | Author (user struct)                      |
| Description  | string      | Milestone description                     |
| Url          | string      | Milestone URL                             |
| Issues       | []Issue     | Issues in this milestone                  |

### Review
| Field        | Type        | Description                              |
|--------------|-------------|------------------------------------------|
| ID           | string      | Primary key, review ID                    |
| RepositoryID | string      | Foreign key to Repository                 |
| AuthorID     | string      | Foreign key to User                       |
| PullRequestID| string      | Foreign key to PullRequest                |
| CreatedAt    | time.Time   | Review creation time                      |
| PullRequest  | *PullRequest| Pull request reviewed                     |
| Author       | *User       | Author (user struct)                      |

### GnoNamespace
| Field       | Type   | Description                    |
|-------------|--------|--------------------------------|
| Hash        | string | Primary key, namespace hash     |
| Namespace   | string | Namespace name (unique)         |
| Address     | string | Wallet address                  |
| BlockHeight | int64  | Block height registered         |

### GnoPackage
| Field       | Type   | Description                    |
| ----------- | ------ | ------------------------------ |
| Publisher   | string | Primary key, publisher address |
| Path        | string | Primary key, package path      |
| Namespace   | string | Foreign key to Namespace       |
| BlockHeight | int64  | Block height registered        |

### GnoProposal
| Field       | Type   | Description                    |
|-------------|--------|--------------------------------|
| ID          | string | Primary key, proposal ID        |
| Title       | string | Proposal title                  |
| Description | string | Proposal description            |
| Address     | string | Proposal origin address        |
| Path        | string | Proposal path        |
| BlockHeight | int64  | Block height registered         |
| Files       | []File | Files in this proposal          |
| Votes       | []GnoVote | Votes on this proposal          |
| ExecutionHeight | int64 | Execution height                |
| Status      | string | Proposal status                 |

### GnoVote
| Field       | Type   | Description                    |
|-------------|--------|--------------------------------|
| ProposalID  | string | Primary key, proposal ID        |
| Address     | string | Voter address        |
| BlockHeight | int64  | Block height registered         |
| Vote        | string | Proposal vote  (yes/abstain/no)               |
| Hash        | string | Proposal hash                 |

### GovDaoMember
| Field       | Type   | Description                    |
|-------------|--------|--------------------------------|
| Address     | string | Primary key, wallet address        |
| Tier        | string | Member tier                 |

### File
| Field       | Type   | Description                    |
|-------------|--------|--------------------------------|
| ID          | string | Primary key, file ID        |
| Name        | string | File name                 |
| Body        | string | File content                 |
| GnoProposalID | string | Proposal ID                 |

### Leaderboard Webhook
| Field       | Type   | Description                    |
|-------------|--------|--------------------------------|
| ID          | uint | Primary key, webhook ID        |
| Url         | string | Webhook URL                 |
| UserID      | string | User ID                 |
| Type        | string | Webhook type (discord/slack)  |
| Frequency   | string | Webhook frequency (daily/weekly) |
| Day         | int    | Day of the week (0-6)         |
| Hour        | int    | Hour of the day (0-23)        |
| Minute      | int    | Minute of the hour (0-59)     |
| Timezone    | string | Timezone                      |
| Repositories| []string | Repositories to monitor       |
| Active      | bool   | Webhook active status         |
| NextRunAt   | time.Time | Next run time                 |
| CreatedAt   | time.Time | Webhook creation time         |
| UpdatedAt   | time.Time | Webhook update time           |

### AI Report

The `Report` model stores generated ecosystem reports:

| Field     | Type      | Description                            |
| --------- | --------- | -------------------------------------- |
| ID        | string    | Unique report ID                       |
| CreatedAt | time.Time | Timestamp of report creation           |
| Data      | string    | JSON string containing the report data |

The `Data` field contains a JSON object with the following structure:

```json
{
  "cycle": "Weekly Report #17 — July 24, 2025",
  "projects": [
    {
      "name": "gnolang/gno",
      "summary": "The ancient scriptstone of Gno hummed with activity this cycle..."
    }
    // ... more projects
  ]
}
```