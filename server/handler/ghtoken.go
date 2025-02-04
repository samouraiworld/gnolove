package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/go-github/v64/github"
	"github.com/samouraiworld/topofgnomes/server/signer"
)

const (
	clientID     = "Ov23liMorBdfpgk1Ojzz"
	clientSecret = "24f350a5c25e2ab5cf638abfa3d87e7e155a2ee8"
	redirectURI  = "http://localhost:5500"
)

type GitHubTokenResponse struct {
	AccessToken string `json:"access_token"`
}

func exchangeCodeForToken(code string) (*GitHubTokenResponse, error) {
	url := "https://github.com/login/oauth/access_token"
	body := fmt.Sprintf("client_id=%s&client_secret=%s&code=%s", clientID, clientSecret, code)

	req, err := http.NewRequest("POST", url, strings.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var tokenResponse GitHubTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
		return nil, err
	}

	return &tokenResponse, nil
}

type resCallback struct {
	Success string `json:"success"`
	Error   string `json:"error"`
}

func CallbackHandler(signer *signer.Signer) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		err := verifyTokenBelongsToUser(r)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(resCallback{Error: err.Error()})
			return
		}

		err = signer.CallVerify(r.URL.Query().Get("address"), r.URL.Query().Get("login"))
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(resCallback{Error: err.Error()})
			return
		}

		json.NewEncoder(w).Encode(resCallback{Success: "true"})
	}
}

func verifyTokenBelongsToUser(r *http.Request) error {
	code := r.URL.Query().Get("code")
	if code == "" {
		return fmt.Errorf("code not found")
	}
	login := r.URL.Query().Get("login")
	address := r.URL.Query().Get("address")
	if login == "" {
		return fmt.Errorf("login not found")
	}
	if address == "" {
		return fmt.Errorf("address not found")
	}

	token, err := exchangeCodeForToken(code)
	if err != nil {
		return fmt.Errorf("failed to exchange code for token: %w", err)
	}

	client := github.NewClient(nil).WithAuthToken(token.AccessToken)
	user, _, err := client.Users.Get(context.Background(), "")
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	if *user.Login != login {
		return fmt.Errorf("token does not belong to user")
	}

	return nil
}
