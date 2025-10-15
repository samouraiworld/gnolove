#!/usr/bin/env bash

# Generated using Claude Sonnet 4.5
# Script to create fake governance DAO data using gnokey
# This replicates the functionality of CreateFakeGovDAOData

set -e

# Configuration
CHAINID="${CHAINID:-dev}"
REMOTE="${REMOTE:-tcp://127.0.0.1:26657}"
GAS_FEE="${GAS_FEE:-1000000ugnot}"
GAS_WANTED="${GAS_WANTED:-50000000}"
DAO_PKGPATH="gno.land/r/gov/dao/v3/impl"
DAO_PROXY_PKGPATH="gno.land/r/gov/dao"

# Account names (use existing keys)
MEMBER_ACCOUNT_A="a"
MEMBER_ACCOUNT_B="b"
MEMBER_ACCOUNT_C="c"
MEMBER_ACCOUNT_D="d"

# Test account (you should replace with your actual test account)
DEFAULT_ACCOUNT="$MEMBER_ACCOUNT_A"

# Mnemonics for account creation (fill these in with your mnemonics)
MEMBER_MNEMONIC_A="print grid fox select chef cook beauty produce hospital recipe fabric umbrella news alley caution pattern sibling success wheat review write another hub attitude"  # Fill with account admin mnemonic
MEMBER_MNEMONIC_B="tomato rubber future nest adapt syrup mansion buyer square ladder love sister quit left bind hurt abstract slab grunt stay festival ugly cash legal"  # Fill with member1 mnemonic  
MEMBER_MNEMONIC_C="cannon spray glance dad short between office sing warm between kingdom olive glare oblige engage hamster save myth ribbon chicken shallow begin display dutch"  # Fill with member2 mnemonic
MEMBER_MNEMONIC_D="emerge tide pitch monitor exclude flush ceiling catch breeze cruel stock hard final join wool borrow bag whale canoe input position orphan hair better"  # Fill with member3 mnemonic

# Address variables (will be populated after account creation)
MEMBER_A_ADDR="g17raryfukyf7an7p5gcklru4kx4ulh7wnx44ync"
MEMBER_B_ADDR="g1df0jqsjfly5dh9qrfx9hmdq9ncs3klkycp2k4k"
MEMBER_C_ADDR="g1lrzc8qmj2j4gp94z3qzaxan9exp6w59gavrq6c"
MEMBER_D_ADDR="g1cke7p70zcqtkgc29l6fk8d4zymjwva7slllpj4"

# Fake addresses for T2/T1 proposals
MEMBER_T2_1_ADDR="g1fakemember1111111111111111111111111111"
MEMBER_T2_2_ADDR="g1fakemember2222222222222222222222222222"  
MEMBER_T1_1_ADDR="g1fakemember3333333333333333333333333333"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

register_namespace() {
    local namespace=$1
    local creator=$2

    log_step "Register namespace $namespace to address $creator"

    gnokey maketx call \
        -pkgpath "gno.land/r/gnoland/users/v1" \
        -func "Register" \
        -args "$namespace" \
        -gas-fee "$GAS_FEE" \
        -gas-wanted "$GAS_WANTED" \
        -send "1000000ugnot" \
        -broadcast \
        -chainid "$CHAINID" \
        -remote "$REMOTE" \
        "$creator"

    log_success "Namespace registered"
}

# Function to add a member directly
add_member() {
    local creator=$1
    local new_member_addr=$2
    local tier=$3
    
    log_step "Adding member $new_member_addr to tier $tier"
    
    gnokey maketx call \
        -pkgpath "$DAO_PKGPATH" \
        -func "AddMember" \
        -args "$new_member_addr" \
        -gas-fee "$GAS_FEE" \
        -gas-wanted "$GAS_WANTED" \
        -send "" \
        -broadcast \
        -chainid "$CHAINID" \
        -remote "$REMOTE" \
        "$creator"
    
    log_success "Member added"
}

# Function to create a proposal to add a member
create_member_proposal() {
    local creator=$1
    local new_member_addr=$2
    local tier=$3
    local portfolio=$4
    
    log_step "Creating proposal to add member $new_member_addr to tier $tier"
    
    # Create a Gno script that calls NewAddMemberRequest and then CreateProposal
    local script="package main

import (
    \"gno.land/r/gov/dao\"
    \"gno.land/r/gov/dao/v3/impl\"
)

func main() {
    // Create the proposal request
    req := impl.NewAddMemberRequest(cross, address(\"$new_member_addr\"), \"$tier\", \"$portfolio\")
    
    // Create the proposal with the request
    dao.MustCreateProposal(cross, req)
}"
    
    # Write script to temporary file
    local tmpfile="/tmp/proposal_script.gno"
    echo "$script" > "$tmpfile"
    echo $tmpfile

    # Execute the script
    gnokey maketx run \
        -gas-fee "$GAS_FEE" \
        -gas-wanted "$GAS_WANTED" \
        -broadcast \
        -chainid "$CHAINID" \
        -remote "$REMOTE" \
        "$creator" \
        $tmpfile
    
    # Clean up
    rm "$tmpfile"
    
    log_success "Proposal created"
}

# Function to vote on a proposal
vote_on_proposal() {
    local voter=$1
    local proposal_id=$2
    local vote_option=$3
    
    log_step "Voting $vote_option on proposal $proposal_id as $voter"
    
    gnokey maketx call \
        -pkgpath "$DAO_PROXY_PKGPATH" \
        -func "MustVoteOnProposalSimple" \
        -args "$proposal_id" \
        -args "$vote_option" \
        -gas-fee "$GAS_FEE" \
        -gas-wanted "$GAS_WANTED" \
        -send "" \
        -broadcast \
        -chainid "$CHAINID" \
        -remote "$REMOTE" \
        "$voter"
    
    log_success "Vote submitted"
}

# Function to execute a proposal
execute_proposal() {
    local executor=$1
    local proposal_id=$2
    
    log_step "Executing proposal $proposal_id"
    
    gnokey maketx call \
        -pkgpath "$DAO_PROXY_PKGPATH" \
        -func "ExecuteProposal" \
        -args "$proposal_id" \
        -gas-fee "$GAS_FEE" \
        -gas-wanted "$GAS_WANTED" \
        -send "" \
        -broadcast \
        -chainid "$CHAINID" \
        -remote "$REMOTE" \
        "$executor"
    
    log_success "Proposal executed"
}

# Main script
main() {
    log_info "Starting fake governance DAO data creation"
    log_info "Using account: $DEFAULT_ACCOUNT"
    log_info "Chain ID: $CHAINID"
    log_info "Remote: $REMOTE"
    echo ""
    
    # Check that existing accounts are available
    log_info "=== Checking Existing Accounts ==="
    
    if ! gnokey list | grep -q " $MEMBER_ACCOUNT_A "; then
        echo "ERROR: Account '$MEMBER_ACCOUNT_A' not found. Please make sure it exists."
        exit 1
    fi
    if ! gnokey list | grep -q " $MEMBER_ACCOUNT_B "; then
        echo "ERROR: Account '$MEMBER_ACCOUNT_B' not found. Please make sure it exists."
        exit 1
    fi
    if ! gnokey list | grep -q " $MEMBER_ACCOUNT_C "; then
        echo "ERROR: Account '$MEMBER_ACCOUNT_C' not found. Please make sure it exists."
        exit 1
    fi
    if ! gnokey list | grep -q " $MEMBER_ACCOUNT_D "; then
        echo "ERROR: Account '$MEMBER_ACCOUNT_D' not found. Please make sure it exists."
        exit 1
    fi
    
    log_success "All accounts found"
    
    # Using existing accounts
    log_info "=== Using Existing Accounts ==="
    log_success "Using existing accounts a, b, c, d"
    
    log_info "Admin (account $MEMBER_ACCOUNT_A): $MEMBER_A_ADDR"
    log_info "Member 1 (account $MEMBER_ACCOUNT_B): $MEMBER_B_ADDR"
    log_info "Member 2 (account $MEMBER_ACCOUNT_C): $MEMBER_C_ADDR" 
    log_info "Member 3 (account $MEMBER_ACCOUNT_D): $MEMBER_D_ADDR"
    log_info "T2 Member 1 (proposal): $MEMBER_T2_1_ADDR"
    log_info "T2 Member 2 (proposal): $MEMBER_T2_2_ADDR"
    log_info "T1 Member 1 (proposal): $MEMBER_T1_1_ADDR"
    
    # Register namespaces for the 3 members using their own accounts
    log_info "=== Registering Namespaces ==="
    
    register_namespace "member000" "$MEMBER_ACCOUNT_A"
    register_namespace "member111" "$MEMBER_ACCOUNT_B"
    register_namespace "member222" "$MEMBER_ACCOUNT_C"
    register_namespace "member333" "$MEMBER_ACCOUNT_D"
    
    # Example: Add 3 T3 members directly
    log_info "=== Adding T3 Members ==="

    # Member 1: Add a T3 member
    add_member "$DEFAULT_ACCOUNT" \
        "$MEMBER_B_ADDR" \
        "T3"
    
    # Member 2: Add another T3 member
    add_member "$DEFAULT_ACCOUNT" \
        "$MEMBER_C_ADDR" \
        "T3"
    
    # Member 3: Add another T3 member
    add_member "$DEFAULT_ACCOUNT" \
        "$MEMBER_D_ADDR" \
        "T3"
    
    echo ""
    log_info "=== Creating Proposals ==="
    
    # Create proposals to add T2 and T1 members (requires voting)
    # Proposal 1: Add a T2 member
    create_member_proposal "$DEFAULT_ACCOUNT" \
        "$MEMBER_D_ADDR" \
        "T2" \
        "# T2 Member Portfolio\n\n- Senior contributor\n- 2+ years experience\n- Active in governance"
    
    # Proposal 2: Add another T2 member
    create_member_proposal "$DEFAULT_ACCOUNT" \
        "$MEMBER_T2_2_ADDR" \
        "T2" \
        "# T2 Member Portfolio\n\n- Core developer\n- Community leader\n- Technical expertise"
    
    # Proposal 3: Add a T1 member
    create_member_proposal "$DEFAULT_ACCOUNT" \
        "$MEMBER_T1_1_ADDR" \
        "T1" \
        "# T1 Member Portfolio\n\n- Executive team\n- Strategic advisor\n- Long-term vision"
    
    echo ""
    log_info "=== Voting on Proposals ==="
    
    # Vote YES on all proposals (proposal IDs start at 0)
    vote_on_proposal "$MEMBER_ACCOUNT_A" "0" "YES"
    
    vote_on_proposal "$MEMBER_ACCOUNT_A" "1" "YES"
    
    vote_on_proposal "$MEMBER_ACCOUNT_A" "2" "YES"
    
    echo ""
    log_success "Fake data creation completed!"
    log_info "Added 3 T3 members directly"
    log_info "Created 3 proposals (2 for T2, 1 for T1)"
    log_info "Voted YES on all proposals"
    log_info ""
    log_info "Note: Proposals need supermajority to pass"
    log_info "You may need more votes or execute proposals manually"
}

# Show usage if help is requested
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0"
    echo ""
    echo "Creates fake governance DAO data using gnokey commands"
    echo ""
    echo "Prerequisites:"
    echo "  You must have the following existing accounts in your keyring:"
    echo "    - '$MEMBER_ACCOUNT_A' (DEFAULT_ACCOUNT for creating proposals)"
    echo "    - '$MEMBER_ACCOUNT_B' (T3 Member 1)"
    echo "    - '$MEMBER_ACCOUNT_C' (T3 Member 2)" 
    echo "    - '$MEMBER_ACCOUNT_D' (T3 Member 3)"
    echo ""
    echo "  The script will use these existing accounts."
    echo ""
    echo "Environment variables:"
    echo "  CHAINID         Chain ID (default: dev)"
    echo "  REMOTE          Remote node address (default: tcp://127.0.0.1:26657)"
    echo "  GAS_FEE         Gas fee (default: 1000000ugnot)"
    echo "  GAS_WANTED      Gas wanted (default: 50000000)"
    echo ""
    echo "Examples:"
    echo "  $0"
    echo "  CHAINID=portal-loop REMOTE=https://rpc.gno.land:443 $0"
    echo ""
    echo "Features:"
    echo "  - Use existing accounts a, b, c, d"
    echo "  - Register namespaces for T3 members using their own accounts"
    echo "  - Add DAO T3 members directly (using member accounts)"
    echo "  - Create proposals for higher tier members (T2, T1)"
    echo "  - Vote on all created proposals using admin account"
    echo ""
    echo "Username rules (v1):"
    echo "  - Must start with 3 letters (lowercase)"
    echo "  - Must end with 3 numbers"
    echo "  - Max 20 characters"
    echo "  - Only special character allowed: _"
    echo "  - Registration cost: 1 GNOT"
    exit 0
fi

# Run main function
main
