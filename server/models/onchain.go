package models

type GnoNamespace struct {
	Hash        string `gorm:"primaryKey" json:"hash"`
	Namespace   string `gorm:"primaryKey,index" json:"namespace"`
	Address     string `json:"address"`
	BlockHeight int64  `json:"blockHeight"`
}

type GnoPackage struct {
	Publisher   string `gorm:"primaryKey" json:"address"`
	Path        string `json:"path" gorm:"primaryKey"`
	Namespace   string `json:"namespace" gorm:"index"`
	BlockHeight int64  `json:"blockHeight"`
}

type GnoProposal struct {
	ID              string    `gorm:"primaryKey" json:"id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	Address         string    `json:"address" gorm:"index"`
	Path            string    `json:"path" gorm:"index"`
	BlockHeight     int64     `json:"blockHeight" gorm:"index"`
	Files           []File    `json:"files" gorm:"constraint:OnDelete:CASCADE;"`
	Votes           []GnoVote `json:"votes" gorm:"foreignKey:ProposalID;references:ID;constraint:OnDelete:CASCADE;"`
	ExecutionHeight int64     `json:"executionHeight"`
	Status          string    `json:"status"`
}

type GnoVote struct {
	ProposalID  string `json:"proposalID" gorm:"primaryKey,index"`
	Address     string `json:"address" gorm:"primaryKey,index"`
	BlockHeight int64  `json:"blockHeight" gorm:"index"`
	Vote        string `json:"vote"`
	Hash        string `gorm:"primaryKey" json:"hash"`
}

type File struct {
	ID   string `gorm:"primaryKey" json:"id"`
	Name string `json:"name"`
	Body string `json:"body"`

	GnoProposalID string `json:"proposalID"`
}
