package models

type User struct {
	Login     string `json:"login"`
	ID        string `gorm:"primarykey" json:"id"`
	AvatarUrl string `json:"avatarURL"`
	URL       string `json:"URL"`
	Name      string `json:"name"`
	Wallet    string `json:"wallet"`

	Issues       []Issue       `gorm:"foreignKey:AuthorID" json:"issues"`
	PullRequests []PullRequest `gorm:"foreignKey:AuthorID" json:"pullRequests"`
	Reviews      []Review      `gorm:"foreignKey:AuthorID" json:"reviews"`
	Commits      []Commit      `gorm:"foreignKey:AuthorID" json:"commits"`
}
