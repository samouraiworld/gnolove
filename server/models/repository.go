package models

import (
	"fmt"
	"os"
	"strings"
)

type Repository struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Owner      string `json:"owner"`
	BaseBranch string `json:"baseBranch"`
}

func GetRepositoriesFromConfig() ([]Repository, error) {
	repositoriesCfg := strings.Split(os.Getenv("REPOSITORIES"), " ")
	repositories := make([]Repository, len(repositoriesCfg))
	for index, repository := range repositoriesCfg {
		parts := strings.Split(repository, "/")
		if len(parts) != 3 {
			return nil, fmt.Errorf("invalid repository %s", repository)
		}
		repositories[index] = Repository{
			ID:         parts[0] + "/" + parts[1], // without base branch
			Name:       parts[1],
			Owner:      parts[0],
			BaseBranch: parts[2],
		}
	}

	fmt.Println(repositories)

	return repositories, nil
}
