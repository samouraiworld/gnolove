generate.graphql:
	go run github.com/Khan/genqlient@85e2e8dffd211c83a2be626474993ef68e44a242 graph/genclient.yaml
	
get-schema:
	curl https://raw.githubusercontent.com/octokit/graphql-schema/refs/heads/main/schema.graphql -o graph/schema.graphql