package onchain

import (
	"context"
	"fmt"
	"os"

	"github.com/gnolang/gno/gno.land/pkg/gnoclient"
	rpcclient "github.com/gnolang/gno/tm2/pkg/bft/rpc/client"
	"github.com/gnolang/gno/tm2/pkg/crypto"
)

// createGnoClient creates a new Gno client with RPC connection
func createGnoClient() (*gnoclient.Client, error) {
	rpcEndpoint := os.Getenv("GNO_RPC_ENDPOINT")
	if rpcEndpoint == "" {
		return nil, fmt.Errorf("GNO_RPC_ENDPOINT is not set")
	}

	client, err := rpcclient.NewHTTPClient(rpcEndpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to create RPC client: %w", err)
	}

	return &gnoclient.Client{RPCClient: client}, nil
}

// GetGnoBalance fetches the GNO balance for a given wallet address from the Gno blockchain.
func GetGnoBalance(ctx context.Context, wallet string) (string, error) {
	if wallet == "" {
		return "0", nil
	}

	gnocl, err := createGnoClient()
	if err != nil {
		return "0", fmt.Errorf("failed to create Gno client: %w", err)
	}

	arr, err := crypto.AddressFromString(wallet)
	if err != nil {
		return "0", fmt.Errorf("failed to parse address: %w", err)
	}
	account, _, err := gnocl.QueryAccount(arr)
	if err != nil {
		return "0", fmt.Errorf("failed to query account: %w", err)
	}
	if account == nil {
		// address exists but no state yet
		return "0", nil
	}

	return fmt.Sprintf("%d", account.GetCoins().AmountOf("ugnot")), nil
}

// GetGnoRenderOutput fetches the output of the Render function for a given package path (ex: gno.land/r/leon/home)
// renderPath is the argument of the Render function
func GetGnoRenderOutput(ctx context.Context, packagePath string, renderPath string) (string, error) {
	if packagePath == "" {
		return "", fmt.Errorf("package path cannot be empty")
	}

	gnocl, err := createGnoClient()
	if err != nil {
		return "0", fmt.Errorf("failed to create Gno client: %w", err)
	}

	result, _, err := gnocl.Render(packagePath, renderPath)
	if err != nil {
		return "0", fmt.Errorf("failed to render: %w", err)
	}

	return result, nil
}
