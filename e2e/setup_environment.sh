#!/bin/bash

# Generated using Claude Sonnet 4.5
# Environment Setup Script for GnoLove E2E Testing
# This script can be sourced by other scripts or run standalone

# Only set exit on error if not being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    set -e  # Exit on any error
fi

echo "🚀 Setting up GnoLove development environment..."

# Get the current directory
CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")
E2E_DIR="$CURRENT_DIR"

# Use address from environment variable or fallback to default
ADDRESS="g17raryfukyf7an7p5gcklru4kx4ulh7wnx44ync"
echo "📍 Using address: $ADDRESS"

# Array to store all background process PIDs
PIDS=()

# Variable to store backup timestamp for cleanup
BACKUP_TIMESTAMP=""

# Cleanup function to kill all background processes
cleanup() {
    echo ""
    echo "🛑 Cleaning up background processes..."
    
    # Kill all tracked PIDs
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔪 Killing process $pid..."
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    # Kill any remaining processes by name
    pkill -f 'tx-indexer' 2>/dev/null || true
    pkill -f 'gnodev' 2>/dev/null || true
    pkill -f 'pnpm.*dev' 2>/dev/null || true
    pkill -f 'go run.*server' 2>/dev/null || true
    
    # Stop docker compose in gnomonitoring directory
    if [ -d "$E2E_DIR/gnomonitoring/backend" ]; then
        cd "$E2E_DIR/gnomonitoring/backend"
        docker compose down 2>/dev/null || true
    fi
    
    # Restore original configuration files if backups exist
    if [ -n "$BACKUP_TIMESTAMP" ]; then
        echo "🔄 Restoring original configuration files..."
        BACKUP_DIR="$E2E_DIR/backups/$BACKUP_TIMESTAMP"
        
        if [ -d "$BACKUP_DIR" ]; then
            cd "$PARENT_DIR"
            
            # Restore frontend .env
            if [ -f "$BACKUP_DIR/.env.front" ]; then
                cp "$BACKUP_DIR/.env.front" ".env"
                echo "✅ Restored original .env"
            fi
            
            # Restore backend server/.env
            if [ -f "$BACKUP_DIR/.env.back" ]; then
                cp "$BACKUP_DIR/.env.back" "server/.env"
                echo "✅ Restored original server/.env"
            fi
            
            # Restore gnomonitoring config.yaml
            if [ -f "$BACKUP_DIR/config.yaml" ] && [ -d "$E2E_DIR/gnomonitoring/backend" ]; then
                cp "$BACKUP_DIR/config.yaml" "$E2E_DIR/gnomonitoring/backend/config.yaml"
                echo "✅ Restored original gnomonitoring config.yaml"
            fi
            
            echo "📦 All configs restored from: $BACKUP_DIR"
        fi
    fi
    
    echo "✅ Cleanup complete!"
    exit 0
}

# Trap signals to run cleanup function
trap cleanup EXIT INT TERM

# Dependency check function
check_dependencies() {
    echo "🔍 Checking dependencies..."
    local missing_deps=()
    
    # Check for required commands
    local deps=(
        "git:Git version control"
        "docker:Docker container platform"
        "docker compose:Docker Compose (or docker-compose)"
        "go:Go programming language"
        "pnpm:PNPM package manager"
    )
    
    for dep in "${deps[@]}"; do
        cmd="${dep%%:*}"
        desc="${dep##*:}"
        
        if ! command -v "$cmd" &> /dev/null; then
            # Special check for docker compose (can be 'docker compose' or 'docker-compose')
            if [[ "$cmd" == "docker compose" ]]; then
                if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
                    missing_deps+=("$desc")
                fi
            else
                missing_deps+=("$desc")
            fi
        fi
    done
    
    # Report missing dependencies
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo "❌ Missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        echo "Please install the missing dependencies and try again."
        echo "💡 Installation guides:"
        echo "  - Git: https://git-scm.com/downloads"
        echo "  - Docker: https://docs.docker.com/get-docker/"
        echo "  - Go: https://golang.org/dl/"
        echo "  - PNPM: https://pnpm.io/installation"
        echo "  - Gno tools: https://docs.gno.land/getting-started/local-setup"
        exit 1
    fi
    
    echo "✅ All dependencies are installed!"
    echo ""
}

# Run dependency check
check_dependencies

echo "📁 Working in: $CURRENT_DIR"

# 1. Clone tx-indexer (don't clone if it already exists)
echo "🔄 Setting up tx-indexer..."
if [ ! -d "$E2E_DIR/tx-indexer" ]; then
    echo "📦 Cloning tx-indexer..."
    cd "$E2E_DIR"
    git clone git@github.com:gnolang/tx-indexer.git
else
    echo "✅ tx-indexer already exists"
fi

cd "$E2E_DIR/tx-indexer"

# Build tx-indexer if binary doesn't exist or source is newer
if [ ! -f "./build/tx-indexer" ] || [ "$(find . -name '*.go' -newer ./build/tx-indexer 2>/dev/null)" ]; then
    echo "🔨 Building tx-indexer..."
    make build
    echo "✅ tx-indexer built successfully"
else
    echo "✅ tx-indexer binary is up-to-date"
fi

# 2. Clone gnomonitoring
echo "📦 Cloning gnomonitoring..."
cd "$E2E_DIR"
if [ ! -d "gnomonitoring" ]; then
    git clone --single-branch --branch fix/modified-metrics-port git@github.com:Davphla/gnomonitoring.git
else
    echo "✅ gnomonitoring already exists"
fi

cd "$E2E_DIR/gnomonitoring/backend"

# Copy config.yaml for testing
echo "📝 Setting up gnomonitoring config..."
if [ -f "$E2E_DIR/configs/config.yaml" ]; then
    cp "$E2E_DIR/configs/config.yaml" "config.yaml"
    echo "✅ Copied test config.yaml"
else
    echo "⚠️  Test config.yaml not found in $E2E_DIR/configs"
fi

# Start docker compose in background
echo "🐳 Starting docker compose..."
docker compose up &
DOCKER_PID=$!
PIDS+=($DOCKER_PID)
echo "docker compose started with PID: $DOCKER_PID"

# 3. Clone gno
echo "📦 Cloning gno..."
cd "$E2E_DIR"
if [ ! -d "gno" ]; then
    git clone git@github.com:gnolang/gno.git
else
    echo "✅ gno already exists"
fi

cd "$E2E_DIR/gno"


# Update the loader file
LOADER_FILE="./examples/gno.land/r/gov/dao/v3/loader/loader.gno"
if [ -f "$LOADER_FILE" ]; then
    echo "📝 Updating loader file with address and invitation points..."
    sed -i "s/memberstore\.Get()\.SetMember(memberstore\.T1, address(\"[^\"]*\"), &memberstore\.Member{InvitationPoints: [0-9]*})/memberstore.Get().SetMember(memberstore.T1, address(\"$ADDRESS\"), \&memberstore.Member{InvitationPoints: 100})/g" "$LOADER_FILE"
    echo "✅ Updated loader file with address: $ADDRESS and InvitationPoints: 100"
else
    echo "⚠️  Loader file not found at: $LOADER_FILE"
fi

make install

# Start gnodev
echo "🚀 Starting gnodev..."
nohup bash -c gnodev ./examples/gno.land/r/gov/dao/v3/loader &
GNODEV_PID=$!
PIDS+=($GNODEV_PID)
echo "gnodev started with PID: $GNODEV_PID"

sleep 5

echo "🌐 Opening browser page..."
if command -v firefox &> /dev/null; then
    firefox "http://localhost:8888/r/gov/dao/v3/loader" &
elif command -v google-chrome &> /dev/null; then
    google-chrome "http://localhost:8888/r/gov/dao/v3/loader" &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser "http://localhost:8888/r/gov/dao/v3/loader" &
else
    echo "⚠️  No supported browser found. Please open http://localhost:8888/r/gov/dao/v3/loader manually"
fi

# Now start tx-indexer (needs gno node to be running)
echo "🚀 Starting tx-indexer..."
cd "$E2E_DIR/tx-indexer"

# Delete indexer-db file if it exists
if [ -f "indexer-db" ]; then
    echo "🗑️  Removing existing indexer-db..."
    rm -f indexer-db
fi

./build/tx-indexer start --remote http://127.0.0.1:26657 --db-path indexer-db &
TX_INDEXER_PID=$!
PIDS+=($TX_INDEXER_PID)
echo "tx-indexer started with PID: $TX_INDEXER_PID"

# Open browser page

# 4. Setup gnolove
echo "🎯 Setting up gnolove..."
cd "$PARENT_DIR"

# Setup test configuration files with backup
echo "📄 Setting up test configuration files..."
BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$E2E_DIR/backups/$BACKUP_TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Backup and copy frontend .env
if [ -f ".env" ]; then
    cp ".env" "$BACKUP_DIR/.env"
    echo "💾 Backed up existing .env"
fi

if [ -f "$E2E_DIR/configs/.env.front" ]; then
    cp "$E2E_DIR/configs/.env.front" ".env"
    echo "✅ Copied test .env for frontend"
else
    echo "⚠️  Test .env not found in $E2E_DIR/configs"
fi

# Backup and copy backend server/.env
if [ -f "server/.env" ]; then
    cp "server/.env" "$BACKUP_DIR/.env.back"
    echo "💾 Backed up existing server/.env"
fi

if [ -f "$E2E_DIR/configs/env.back" ]; then
    cp "$E2E_DIR/configs/env.back" "server/.env"
    echo "✅ Copied test .env.back for backend"
else
    echo "⚠️  Test .env.back not found in $E2E_DIR/configs"
fi

# Backup gnomonitoring config.yaml (if it exists)
if [ -f "$E2E_DIR/gnomonitoring/backend/config.yaml" ]; then
    cp "$E2E_DIR/gnomonitoring/backend/config.yaml" "$BACKUP_DIR/config.yaml"
    echo "💾 Backed up existing gnomonitoring config.yaml"
fi

echo "📦 All configs backed up to: $BACKUP_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm i

# Start frontend
echo "🚀 Starting frontend..."
pnpm run dev &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
echo "Frontend started with PID: $FRONTEND_PID"

# Start backend
echo "🚀 Starting backend..."
cd ./server 
go run . &
cd "$PARENT_DIR"

BACKEND_PID=$!
PIDS+=($BACKEND_PID)
echo "Backend started with PID: $BACKEND_PID"

echo "✅ Setup complete!"
echo ""
echo "🎉 All services are running:"
echo "  - tx-indexer (PID: $TX_INDEXER_PID)"
echo "  - gnomonitoring docker (PID: $DOCKER_PID)"
echo "  - gnodev (PID: $GNODEV_PID)"
echo "  - gnolove frontend (PID: $FRONTEND_PID)"
echo "  - gnolove backend (PID: $BACKEND_PID)"
echo ""
echo "🌐 URLs:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend: http://localhost:3333"
echo "  - Gno web: http://localhost:8888"
echo "  - DAO loader: http://localhost:8888/r/gov/dao/v3/loader"
echo "  - Monitoring: http://localhost:8880"
echo ""
echo "✅ Environment setup complete!"

# If script is run directly (not sourced), keep it running
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo ""
    echo "💡 Press Ctrl+C to stop all services and exit"
    echo ""
    
    # Keep the script running and wait for user interrupt
    echo "⏳ All services are running. Press Ctrl+C to stop everything..."
    while true; do
        sleep 1
    done
fi