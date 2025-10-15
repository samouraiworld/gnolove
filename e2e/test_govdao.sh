#!/bin/bash

# Generated using Claude Sonnet 4.5
# GovDAO End-to-End Testing Script
# This script sets up the full environment and focuses on GovDAO testing

set -e  # Exit on any error

echo "🎯 Starting GovDAO End-to-End Testing..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the main setup script
echo "🚀 Running main environment setup..."
source "$SCRIPT_DIR/setup_environment.sh"

# Create fake data if available
echo "📊 Creating fake data for GovDAO testing..."

"$SCRIPT_DIR/create_fake_data.sh"
echo "✅ Fake data created successfully"

# Open GovDAO page for testing
echo "🌐 Opening GovDAO page for testing..."
if command -v firefox &> /dev/null; then
    firefox "http://localhost:3000/govdao" &
elif command -v google-chrome &> /dev/null; then
    google-chrome "http://localhost:3000/govdao" &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser "http://localhost:3000/govdao" &
else
    echo "⚠️  No supported browser found. Please open http://localhost:3000/govdao manually"
fi

echo ""
echo "🎉 GovDAO testing environment is ready!"
echo ""
echo "🌐 Testing URLs:"
echo "  - GovDAO Frontend: http://localhost:3000/govdao"
echo "  - Full Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:3333"
echo "  - Gno web: http://localhost:8888"
echo "  - DAO loader: http://localhost:8888/r/gov/dao/v3/loader"
echo "  - Monitoring: http://localhost:8880"
echo ""
echo "🔑 Test address: $ADDRESS"
echo ""
echo "💡 Press Ctrl+C to stop all services and exit"
echo ""

# Keep the script running and wait for user interrupt
echo "⏳ GovDAO testing environment is running. Press Ctrl+C to stop everything..."
while true; do
    sleep 1
done
