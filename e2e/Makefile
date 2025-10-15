# Generated using Claude Sonnet 4.5
# GnoLove E2E Testing Makefile
# Provides convenient targets for different types of testing

.PHONY: help govdao env fake-data clean 

# Default target
help:
	@echo "🚀 GnoLove E2E Testing"
	@echo ""
	@echo "Available targets:"
	@echo ""
	@echo "  🏛️  govdao        - Run GovDAO end-to-end tests (recommended)"
	@echo "  🔧 env           - Setup environment (no specific testing)"
	@echo "  📊 fake-data     - Create fake data (requires running environment)"
	@echo "  🧹 clean         - Clean up processes and restore configs"
	@echo ""
	@echo "Examples:"
	@echo "  make govdao      # Start full GovDAO testing"
	@echo "  make env         # Just setup environment"
	@echo "  make clean       # Stop everything and cleanup"

# GovDAO testing - full setup with DAO focus
govdao:
	@echo "🏛️ Starting GovDAO end-to-end testing..."
	@./test_govdao.sh

# Environment setup
env:
	@echo "🔧 Starting environment setup..."
	@./setup_environment.sh

# Create fake data (requires running environment)
fake-data:
	@if [ -f "./create_fake_data.sh" ]; then \
		echo "📊 Creating fake data..."; \
		chmod +x ./create_fake_data.sh; \
		./create_fake_data.sh; \
	else \
		echo "❌ create_fake_data.sh not found"; \
		exit 1; \
	fi

# Clean up all processes and restore configs
clean:
	@echo "🧹 Cleaning up processes and configurations..."
	@pkill -f 'tx-indexer' 2>/dev/null || true
	@pkill -f 'gnodev' 2>/dev/null || true
	@pkill -f 'pnpm.*dev' 2>/dev/null || true
	@pkill -f 'go run.*server' 2>/dev/null || true
	@if [ -d "./gnomonitoring/backend" ]; then \
		cd ./gnomonitoring/backend && docker compose down 2>/dev/null || true; \
	fi
	@echo "✅ Cleanup complete!"
