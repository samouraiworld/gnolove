package contributor

import (
	"context"
	"github.com/samouraiworld/topofgnomes/server/onchain"
)

func GetContributorOnChainData(wallet string) (struct {
	GnoBalance string
}, error) {
	balance, err := onchain.GetGnoBalance(context.Background(), wallet)
	if err != nil {
		return struct{ GnoBalance string }{GnoBalance: "0"}, err
	}
	return struct{ GnoBalance string }{GnoBalance: balance}, nil
}
