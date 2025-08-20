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
	ID      string `gorm:"primarykey" json:"id"`
	Address string `json:"address"`
	Path    string `json:"path"`

	Files       []File `json:"files"`
	BlockHeight int64  `json:"blockHeight"`
}

type File struct {
	ID   string `gorm:"primaryKey" json:"id"`
	Name string `json:"name"`
	Body string `json:"body"`

	GnoProposalID string `json:"proposalID"`
}
