package models

import "time"

type User struct {
	// ... other fields ...
	TopRepositories string `gorm:"column:top_repositories;type:text" json:"topRepositories"`
	Login     string `json:"login"`
	ID        string `gorm:"primarykey" json:"id"`
	AvatarUrl string `json:"avatarURL"`
	URL       string `json:"URL"`
	Name      string `json:"name"`
	Wallet    string `json:"wallet"`

	Bio             string    `json:"bio"`
	Location        string    `json:"location"`
	JoinDate        time.Time `json:"joinDate"`
	WebsiteUrl      string    `json:"websiteUrl"`
	TwitterUsername string    `json:"twitterUsername"`
	TotalStars      int       `json:"totalStars"`
	TotalRepos      int       `json:"totalRepos"`
	Followers       int       `json:"followers"`
	Following       int       `json:"following"`

	Issues       []Issue       `gorm:"foreignKey:AuthorID" json:"issues"`
	PullRequests []PullRequest `gorm:"foreignKey:AuthorID" json:"pullRequests"`
	Reviews      []Review      `gorm:"foreignKey:AuthorID" json:"reviews"`
	Commits      []Commit      `gorm:"foreignKey:AuthorID" json:"commits"`
}
