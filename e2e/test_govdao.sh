#!/bin/bash

# Generated using Claude Sonnet 4.5
# GovDAO End-to-End Testing Script
# This script sets up the full environment and focuses on GovDAO testing

set -e  # Exit on any error

echo "🎯 Starting GovDAO End-to-End Testing..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check for curl (needed for health checks)
if ! command -v curl &> /dev/null; then
    echo "⚠️  curl not found - health checks will be skipped"
    CURL_AVAILABLE=false
else
    CURL_AVAILABLE=true
fi

# Source the main setup script
echo "🚀 Running main environment setup..."
source "$SCRIPT_DIR/setup_environment.sh"

# Wait for all services to be ready with health checks
echo "⏳ Waiting for all services to be ready..."

if [ "$CURL_AVAILABLE" = true ]; then
    # Function to check if a service is responding
    check_service() {
        local url=$1
        local name=$2
        local max_attempts=10
        local attempt=1
        
        echo -n "🔍 Checking $name..."
        while [ $attempt -le $max_attempts ]; do
            # Accept any HTTP response (including 404) as service being available
            if curl -s "$url" >/dev/null 2>&1; then
                echo " ✅"
                return 0
            fi
            echo -n "."
            sleep 2
            attempt=$((attempt + 1))
        done
        echo " ❌ (timeout after ${max_attempts} attempts)"
        return 1
    }

    # Check each service
    echo "🏥 Performing health checks..."

    # Check frontend (Next.js)
    check_service "http://localhost:3000" "Frontend" || echo "⚠️  Frontend may still be starting..."

    # Check backend API
    check_service "http://localhost:3333" "Backend API" || echo "⚠️  Backend API may still be starting..."

    # Check Gno web interface
    check_service "http://localhost:8888" "Gno Web" || echo "⚠️  Gno Web may still be starting..."

    # Check monitoring service
    check_service "http://localhost:8880" "Monitoring" || echo "⚠️  Monitoring may still be starting..."

    # Additional check for GovDAO page specifically
    echo -n "🏛️ Checking GovDAO page..."
    if curl -s "http://localhost:3000/govdao" >/dev/null 2>&1; then
        echo " ✅"
    else
        echo " ⚠️  (may need additional time to load)"
    fi

    echo "🎯 Health checks completed!"
else
    # Fallback to timed wait if curl is not available
    echo "⏳ curl not available - using timed wait (15 seconds)..."
    sleep 15
    echo "✅ Wait completed!"
fi

# GovDAO specific testing setup
echo "🏛️ Setting up GovDAO specific tests..."

# Create fake data if available
echo "📊 Creating fake data for GovDAO testing..."
if [ -f "$SCRIPT_DIR/create_fake_data.sh" ]; then
    chmod +x "$SCRIPT_DIR/create_fake_data.sh"
    "$SCRIPT_DIR/create_fake_data.sh"
    echo "✅ Fake data created successfully"
else
    echo "⚠️  create_fake_data.sh not found in $SCRIPT_DIR"
fi

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
