package contributor

import (
	"context"
	"fmt"
	"strings"

	"github.com/samouraiworld/topofgnomes/server/onchain"
)

// ContributorData represents the on-chain data for a contributor
type ContributorData struct {
	GnoBalance   string
	RenderOutput string
}

// GetContributorOnChainData retrieves the on-chain data for a contributor
// wallet: the wallet address
// pathName: the path name for rendering (optional, can be empty)
func GetContributorOnChainData(wallet, pathName string) (ContributorData, error) {
	var result ContributorData

	balance, err := getGnoBalance(wallet)
	if err != nil {
		result.GnoBalance = "0"
	} else {
		result.GnoBalance = balance
	}

	if pathName != "" {
		renderOutput, err := getRenderOutput(pathName)
		if err != nil {
			result.RenderOutput = ""
		} else {
			result.RenderOutput = renderOutput
		}
	}

	return result, nil
}

func getGnoBalance(wallet string) (string, error) {
	return onchain.GetGnoBalance(context.Background(), wallet)
}

func getRenderOutput(pathName string) (string, error) {
	packagePath := fmt.Sprintf("gno.land/r/%s/home", strings.ToLower(pathName))
	renderPath := ""

	return onchain.GetGnoRenderOutput(context.Background(), packagePath, renderPath)
}
