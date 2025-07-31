# Gnolove Server

This server will index all the Pull requests, Issues, review, Contributors, etc on gnolang/gno repository (currently hardcoded but could be fully configurable).


### How to launch the service

Prerequisites: 
- Golang > 1.23.0
```sh 
## on Mac
brew install go
## on linux
sudo apt-get install go
```
- Have a valid .env file
```
## you'll ned to create a new file on /server folder named .env with the following variables (present on .env.example):
GITHUB_GRAPHQL_ENDPOINT = (commonly: https://api.github.com/graphql)
GITHUB_API_TOKEN = a personal token as auth for github API

```


```sh
## on server folder
go run .
issues: All updated exiting...
pullRequests: All updated
Server running on port 3333
```
This command will start indexing all important elements on the repository then starting serving the api:

### API
Currently there are 4 functional endpoints
- get stats (curl http://localhost:3333/stats?time=x): where x in (daily|weekly|monthly|yearly)
```json
[
    {
        "Login": "xxxx",
        "ID": "sdsds",
        "AvatarUrl": "https://avatars.githubusercontent.com/u/...",
        "URL": "https://github.com/SOME_LOGIN",
        "Name": "...",
        "TotalIssues": 0,
        "TotalMerged": 0,
        "TotalReviewed": 0
    },
    ...
]
```

- get issues (curl http://localhost:3333/issues?label=help wanted):
```json
[
    {
        "CreatedAt": "2023-11-09T23:46:45Z",
        "UpdatedAt": "2024-11-02T22:01:44.970218+01:00",
        "ID": "I_kwDOE-u6Jc52aPKP",
        "Number": 1352,
        "State": "CLOSED",
        "Title": "proposal: gno.mod `resolve` directive",
        "AuthorID": "MDQ6VXNlcjQ2ODEzMDg=",
        "Author": {
            "Login": "",
            "ID": "",
            "AvatarUrl": "",
            "URL": "",
            "Name": ""
        },
        "Labels": [
            ":package: :robot: gnovm",
            "gno-proposal"
        ]
    },
]
```

- get Issues (curl http://localhost:3333/contributors/newest?number=5):
```json
[
    {
        "Login": "XXX",
        "ID": "XXX==",
        "AvatarUrl": "https://avatars.githubusercontent.com/u/XXX=4",
        "URL": "https://github.com/XXX",
        "Name": "XXX"
    },
    ...
]
```

- get Milestone (curl http://localhost:3333/milestones/{MilestoneNumber}}):
```json
{
    "ID": "MI_kwDOE-u6Jc4AgqQL",
    "CreatedAt": "2022-10-20T09:37:02Z",
    "UpdatedAt": "2024-10-22T02:49:37Z",
    "Number": 4,
    "Title": "🏗4️⃣ test4.gno.land",
    "State": "CLOSED",
    "AuthorID": "MDQ6VXNlcjk0MDI5",
    "Author": {
        "Login": "...",
        "ID": "...",
        "AvatarUrl": "https://avatars.githubusercontent.com/...",
        "URL": "https://github.com/...",
        "Name": "..."
    },
    "Description": "This milestone encompasses the PRs / issues needed to launch a multi-node Gno testnet",
    "Url": "https://github.com/gnolang/gno/milestone/4",
    "Issues": [
        {
            "CreatedAt": "2024-03-25T10:23:09Z",
            "UpdatedAt": "2024-10-22T14:17:29Z",
            "ID": "I_kwDOE-u6Jc6Dc5vg",
            "Number": 1820,
            "State": "CLOSED",
            "Title": "[docs] Create documentation for multinode clusters",
            "AuthorID": "MDQ6VXNlcjE2NzEyNjYz",
            "Author": {
                "Login": "",
                "ID": "",
                "AvatarUrl": "",
                "URL": "",
                "Name": ""
            },
            "Labels": [],
            "MilestoneID": "MI_kwDOE-u6Jc4AgqQL"
        },
        ...
    ]
}
```

