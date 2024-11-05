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
GRAPHQL_ENDPOINT = (commonly: https://api.github.com/graphql)
GITHUB_TOKEN = a personal token as auth for github API

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
Currently there are 2 functional endpoints
- get stats (curl http://localhost:3333/getStats?time=x): where x in (daily|weekly|monthly|yearly)
```json
[
    {
        "Login": "xxxx",
        "ID": "sdsds",
        "AvatarUrl": "https://avatars.githubusercontent.com/u/12271?u=5062f99bcd25d8116ff99e0a87e92a80733b8aea&v=4",
        "URL": "https://github.com/anarcher",
        "Name": "myoung-soo,shin",
        "TotalIssues": 0,
        "TotalMerged": 0,
        "TotalReviewed": 0
    },
    ...
]
```

- get Issues (curl http://localhost:3333/getIssues): where x in (daily|weekly|monthly|yearly)
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

