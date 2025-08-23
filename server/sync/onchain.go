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

func (s *Syncer) syncProposals(ctx context.Context) error {
	s.logger.Info("Syncing Proposals")
	lastBlock := getProposalsLastBlock(s.db)
	response, err := gnoindexerql.GetGovDAOProposals(ctx, s.graphqlClient, int(lastBlock))
	if err != nil {
		return err
	}

	for _, transaction := range response.GetTransactions {
		createProposalEvent, err := getProposalCreatedEvent(transaction.Response.Events)
		if err != nil {
			return err
		}

		for _, msg := range transaction.Messages {
			// Only process MsgRun; skip other message types safely.
			messageRunValue, ok := msg.Value.(*gnoindexerql.GetGovDAOProposalsGetTransactionsTransactionMessagesTransactionMessageValueMsgRun)
			if !ok {
				continue
			}

			var files []models.File
			proposalID := getAttrKey(createProposalEvent.Attrs, "id")
			for idx, file := range messageRunValue.Package.Files {
				files = append(files, models.File{
					ID:            fmt.Sprintf("%s_%d", proposalID, idx),
					Name:          file.Name,
					Body:          file.Body,
					GnoProposalID: proposalID,
				})
			}
			proposal := &models.GnoProposal{
				ID:          proposalID,
				Address:     messageRunValue.Caller,
				Path:        createProposalEvent.Pkg_path,
				Files:       files,
				BlockHeight: int64(transaction.Block_height),
			}

			err = s.db.Save(proposal).Error
			if err != nil {
				return err
			}
		}
	}
	return nil
}
func getProposalCreatedEvent(events []gnoindexerql.GetGovDAOProposalsGetTransactionsTransactionResponseEventsEvent) (*gnoindexerql.GetGovDAOProposalsGetTransactionsTransactionResponseEventsGnoEvent, error) {
	for _, event := range events {
		gnoEvent, ok := event.(*gnoindexerql.GetGovDAOProposalsGetTransactionsTransactionResponseEventsGnoEvent)
		if !ok {
			return nil, fmt.Errorf("invalid event type %T", event)
		}
		if gnoEvent.Type == "ProposalCreated" {
			return gnoEvent, nil
		}
	}

	return nil, fmt.Errorf("no proposal created event found")
}

func getProposalsLastBlock(db *gorm.DB) int64 {
	var lastProposal models.GnoProposal
	db.Model(&lastProposal).Order("block_height desc").First(&lastProposal)
	return lastProposal.BlockHeight
}

func getAttrKey(attributs []gnoindexerql.GetGovDAOProposalsGetTransactionsTransactionResponseEventsGnoEventAttrsGnoEventAttribute, key string) string {
	for _, attr := range attributs {
		if attr.Key == key {
			return attr.Value
		}
	}

	return ""
}
