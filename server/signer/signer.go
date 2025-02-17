package signer

import (
	"fmt"

	"github.com/gnolang/gno/gno.land/pkg/gnoclient"
	"github.com/gnolang/gno/gno.land/pkg/sdk/vm"
	rpcclient "github.com/gnolang/gno/tm2/pkg/bft/rpc/client"
	"github.com/gnolang/gno/tm2/pkg/crypto/keys"
	"github.com/samouraiworld/topofgnomes/server/models"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type Signer struct {
	db                *gorm.DB
	logger            *zap.SugaredLogger
	keyInfo           keys.Info
	gnoclient         *gnoclient.Client
	ghVerifyRealmPath string
	govDAORealmPath   string
}

func New(
	db *gorm.DB,
	logger *zap.SugaredLogger,
	mnemonic,
	chainID,
	rpcEndpoint,
	ghVerifyRealmPath,
	govDAORealmPath string,
) *Signer {
	signer, err := gnoclient.SignerFromBip39(mnemonic, chainID, "", 0, 0)
	if err != nil {
		panic(err)
	}

	keyInfo, err := signer.Info()
	if err != nil {
		panic(err)
	}

	// Initialize the RPC client
	rpc, err := rpcclient.NewHTTPClient(rpcEndpoint)
	if err != nil {
		panic(err)
	}

	// Initialize the gnoclient
	client := gnoclient.Client{
		Signer:    signer,
		RPCClient: rpc,
	}

	return &Signer{
		db:                db,
		logger:            logger,
		keyInfo:           keyInfo,
		ghVerifyRealmPath: ghVerifyRealmPath,
		govDAORealmPath:   govDAORealmPath,
		gnoclient:         &client,
	}
}

func (s *Signer) CallVerify(address string, login string) error {
	acc, _, err := s.gnoclient.QueryAccount(s.keyInfo.GetAddress())
	if err != nil {
		return fmt.Errorf("failed to query account: %w", err)
	}

	baseCfg := gnoclient.BaseTxCfg{
		GasFee:         "1000000ugnot",
		GasWanted:      50000000,
		AccountNumber:  acc.GetAccountNumber(),
		SequenceNumber: acc.GetSequence(),
		Memo:           "ghverify-agent",
	}

	arg := "ingest," + address + ",OK"
	s.logger.Infof("Calling gnoclient withPath: %s and address %s", s.ghVerifyRealmPath, address)
	_, err = s.gnoclient.Call(baseCfg, vm.MsgCall{
		Caller:  s.keyInfo.GetAddress(),
		Send:    nil,
		PkgPath: s.ghVerifyRealmPath,
		Func:    "GnorkleEntrypoint",
		Args:    []string{arg},
	})
	if err != nil {
		return fmt.Errorf("failed to call gnoclient: %s", err.Error())
	}

	return s.db.Model(&models.User{}).Where("login = ?", login).Update("wallet", address).Error
}

func (s *Signer) ClaimTier(login string) error {
	acc, _, err := s.gnoclient.QueryAccount(s.keyInfo.GetAddress())
	if err != nil {
		return fmt.Errorf("failed to query account: %w", err)
	}
	s.logger.Infof("Calling gnoclient withPath: %s and address %s", s.govDAORealmPath)
	baseCfg := gnoclient.BaseTxCfg{
		GasFee:         "1000000ugnot",
		GasWanted:      50000000,
		AccountNumber:  acc.GetAccountNumber(),
		SequenceNumber: acc.GetSequence(),
		Memo:           "GovDao claim Tier",
	}

	_, err = s.gnoclient.Call(baseCfg, vm.MsgCall{
		Caller:  s.keyInfo.GetAddress(),
		Send:    nil,
		PkgPath: s.govDAORealmPath,
		Func:    "ClaimTier",
		Args:    []string{login},
	})
	if err != nil {
		//Just log the error can be just that the user does not have a tier
		s.logger.Errorf("failed to call gnoclient: %s", err.Error())
	}

	return nil
}
