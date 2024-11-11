package models

type User struct {
	Login     string
	ID        string `gorm:"primarykey"`
	AvatarUrl string
	URL       string
	Name      string

	Issues       []Issue       `gorm:"foreignKey:AuthorID"`
	PullRequests []PullRequest `gorm:"foreignKey:AuthorID"`
	Reviews      []Review      `gorm:"foreignKey:AuthorID"`
	Commits      []Commit      `gorm:"foreignKey:AuthorID"`
}
