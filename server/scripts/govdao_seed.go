package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/samouraiworld/topofgnomes/server/db"
	"github.com/samouraiworld/topofgnomes/server/handler"
	"github.com/subosito/gotenv"
	"gorm.io/gorm"
)

const (
	fileName    = "usertiers.gno"
	packageName = "govdao"
)

func CreateSeed(db *gorm.DB) error {
	userWithStats, err := handler.GetUserStats(db, time.Time{}, nil, []string{"gnolang/gno"}, 100)
	if err != nil {
		return err
	}

	outputFile, err := os.Create(fileName)
	if err != nil {
		return err
	}
	defer outputFile.Close()

	_, err = fmt.Fprintf(outputFile, "package %s\n\n", packageName)
	if err != nil {
		return err
	}
	_, err = fmt.Fprintln(outputFile, "var UserTiers = map[string]string{")
	if err != nil {
		return err
	}
	t1, t2 := getTnProportions(userWithStats)

	for i, user := range userWithStats {
		var tier string
		if i < t1 {
			tier = "T1"
		} else if i < t1+t2 {
			tier = "T2"
		} else {
			break
		}
		_, _ = fmt.Fprintf(outputFile, "\t\"%s\": \"%s\",\n", user.Login, tier)
	}

	fmt.Println("Created %s with %d users", fileName, len(userWithStats))
	fmt.Println("Created %d T1", t1)
	fmt.Println("Created %d T2", t2)

	_, err = fmt.Fprintln(outputFile, "}")
	return err
}

func getTnProportions(userWithStats []handler.UserWithStats) (int, int) {
	allUsers := len(userWithStats)
	t1s := int(float64(allUsers) * 0.1) // T1
	t2s := int(float64(allUsers) * 0.3) // T2
	return t1s, t2s
}

func main() {
	gotenv.Load()
	database, err := db.InitDB()
	if err != nil {
		log.Fatal(err)
	}

	err = CreateSeed(database)
	if err != nil {
		panic(err)
	}
}
