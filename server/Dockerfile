# Start from the latest golang base image
FROM golang:1.24

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy everything from the current directory to the Working Directory inside the container
COPY . .

RUN mkdir -p /db

ENV CGO_ENABLED=1
RUN --mount=type=cache,target=/root/.cache/go-build --mount=type=cache,target=/go go build -o bin/main main.go

ENTRYPOINT  [ "/app/bin/main" ]
