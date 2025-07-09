DOCKER_REGISTRY=rg.nl-ams.scw.cloud/teritori
SERVER_DOCKER_IMAGE=$(DOCKER_REGISTRY)/gnolove-server:$(shell git rev-parse --short HEAD)

.PHONY: publish
publish:
	docker build .  --platform linux/amd64 -t $(SERVER_DOCKER_IMAGE)
	docker push $(SERVER_DOCKER_IMAGE)
	
generate.graphql:
	go run github.com/Khan/genqlient@85e2e8dffd211c83a2be626474993ef68e44a242 graph/genclient.yaml
	
get-schema:
	curl https://raw.githubusercontent.com/octokit/graphql-schema/refs/heads/main/schema.graphql -o graph/schema.graphql

.PHONY: generate.graphql
generate.graphql:
	go run github.com/Khan/genqlient@85e2e8dffd211c83a2be626474993ef68e44a242 gnoindexerql/genqlient.yaml