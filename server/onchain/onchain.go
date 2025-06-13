package onchain

import (
	"context"
	"fmt"
	"os"

	"github.com/gnolang/gno/gno.land/pkg/gnoclient"
	rpcclient "github.com/gnolang/gno/tm2/pkg/bft/rpc/client"
	"github.com/gnolang/gno/tm2/pkg/crypto"
)

// GetGnoBalance fetches the GNO balance for a given wallet address from the Gno blockchain.
func GetGnoBalance(ctx context.Context, wallet string) (string, error) {
	if wallet == "" {
		return "0", nil
	}

	rpcEndpoint := os.Getenv("GNO_RPC_ENDPOINT")
	if rpcEndpoint == "" {
		return "0", fmt.Errorf("GNO_RPC_ENDPOINT is not set")
	}

	client, err := rpcclient.NewHTTPClient(rpcEndpoint)
	if err != nil {
		return "0", fmt.Errorf("failed to create RPC client: %w", err)
	}

	gnocl := gnoclient.Client{
		RPCClient: client,
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
