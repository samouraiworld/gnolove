package sync

import (
	"context"
	"fmt"
	"strings"

	"github.com/samouraiworld/topofgnomes/server/gnoindexerql"
	"github.com/samouraiworld/topofgnomes/server/models"
	"gorm.io/gorm"
)

func (s *Syncer) syncGnoUserRegistrations(ctx context.Context) error {
	s.logger.Info("Syncing GnoUserRegistrations")
	lastBlock := getRegistrationsLastBlock(s.db)
	response, err := gnoindexerql.GetUserRegistrations(ctx, s.graphqlClient, int(lastBlock))
	if err != nil {
		return err
	}
	for _, registration := range response.Transactions {
		for _, msg := range registration.Messages {
			msgCall, ok := msg.Value.(*gnoindexerql.GetUserRegistrationsTransactionsTransactionMessagesTransactionMessageValueMsgCall)
			if !ok {
				continue
			}
			if len(msgCall.Args) < 1 {
				s.logger.Warnf("invalid args %s", msg.Value)
				continue
			}
			namespace := &models.GnoNamespace{
				Address:     msgCall.Caller,
				BlockHeight: int64(registration.Block_height),
				Namespace:   msgCall.Args[0],
				Hash:        registration.Hash,
			}

			err = s.db.Save(namespace).Error
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func getRegistrationsLastBlock(db *gorm.DB) int64 {
	var lastRegistration models.GnoNamespace
	db.Model(&lastRegistration).Order("block_height desc").First(&lastRegistration)
	return lastRegistration.BlockHeight
}

func (s *Syncer) syncPublishedPackages(ctx context.Context) error {
	s.logger.Info("Syncing PublishedPackages")
	lastBlock := getPublishedPackagesLastBlock(s.db)
	fmt.Println(lastBlock)
	response, err := gnoindexerql.GetPublishedPackages(ctx, s.graphqlClient, int(lastBlock))
	if err != nil {
		return err
	}

	for _, registration := range response.Transactions {
		for _, msg := range registration.Messages {
			addPkg := msg.Value.(*gnoindexerql.GetPublishedPackagesTransactionsTransactionMessagesTransactionMessageValueMsgAddPackage)
			pathParts := strings.Split(addPkg.Package.Path, "/")
			if len(pathParts) < 2 {
				s.logger.Warnf("invalid path %s", addPkg.Package.Path)
				continue
			}
			namespace := &models.GnoPackage{
				Publisher:   addPkg.Creator,
				BlockHeight: int64(registration.Block_height),
				Namespace:   pathParts[2],
				Path:        addPkg.Package.Path,
			}

			err = s.db.Save(namespace).Error
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func getPublishedPackagesLastBlock(db *gorm.DB) int64 {
	var lastPackage models.GnoPackage
	db.Model(&lastPackage).Order("block_height desc").First(&lastPackage)
	return lastPackage.BlockHeight
}
