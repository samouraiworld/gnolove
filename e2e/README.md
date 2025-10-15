# End-to-End Testing Scripts

This directory contains modular scripts for setting up and running end-to-end tests for GnoLove.

## Scripts

### `test_govdao_only.sh` 🏛️
GovDAO-focused testing script that:
- Calls the main environment setup
- Creates fake data for GovDAO testing
- Opens GovDAO page in browser
- Focuses on DAO-related functionality

### `setup_environment.sh` 🔧
Core environment setup script that:
- Clones and starts all required services (tx-indexer, gnomonitoring, gno)
- Creates test keys and addresses
- Starts gnodev with DAO loader
- Starts GnoLove frontend and backend
- Can be run standalone or sourced by other scripts

### `create_fake_data.sh` 📊
Script to populate the system with fake test data for development and testing.

## Configuration Management

### `configs/` directory
Contains test configuration files:
- `config.yaml` - gnomonitoring test config
- `.env.front` - frontend test environment
- `env.back` - backend test environment

### `backups/` directory
Automatically created timestamped backups of original config files during testing.

## Usage

### Make Targets (Recommended)
```bash
cd e2e

# Show all available targets
make help

# GovDAO testing (recommended)
make govdao

# Environment setup only
make env

# Create fake data
make fake-data

```

### Direct Script Usage
```bash
# GovDAO testing
./test_govdao_only.sh

# Environment setup only
./setup_environment.sh

# Create fake data
./create_fake_data.sh
```

## Requirements

- Docker and Docker Compose
- Go
- Node.js and pnpm
- gnokey and gnodev (built automatically if not found)
- Git with SSH access to GitHub
