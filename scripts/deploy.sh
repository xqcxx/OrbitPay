#!/usr/bin/env bash
# deploy.sh — Build, deploy, and initialise all OrbitPay Soroban contracts
# on Stellar Testnet and write contract IDs to frontend/.env.local.
#
# Usage:
#   ./scripts/deploy.sh [ADMIN_SECRET]
#
# Arguments:
#   ADMIN_SECRET  (optional) Stellar secret key (S…) used as the deployer /
#                 admin account.  If omitted the script generates a fresh key
#                 and funds it via Friendbot.
#
# Requirements:
#   • stellar CLI  (https://developers.stellar.org/docs/tools/developer-tools/cli)
#   • Rust + cargo with wasm32-unknown-unknown target
#   • curl (for Friendbot)

set -euo pipefail

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
FRIENDBOT_URL="https://friendbot.stellar.org"

CONTRACTS_DIR="$(cd "$(dirname "$0")/.." && pwd)/contracts"
WASM_DIR="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release"
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/frontend/.env.local"

# ── Colours ───────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()     { error "$*"; exit 1; }

# ── Admin keypair ─────────────────────────────────────────────────────────────

if [[ -n "${1:-}" ]]; then
  ADMIN_SECRET="$1"
  ADMIN_ADDRESS="$(stellar keys address --secret-key "$ADMIN_SECRET" 2>/dev/null \
    || stellar keys address "$ADMIN_SECRET" 2>/dev/null)" \
    || die "Could not derive public key from provided secret."
  info "Using provided admin: $ADMIN_ADDRESS"
else
  info "No secret supplied — generating a temporary keypair…"
  KEYPAIR="$(stellar keys generate --no-fund --secret-key 2>/dev/null \
    || stellar keys generate --output json 2>/dev/null \
    || die "stellar keys generate failed")"

  # Support different CLI output formats
  if echo "$KEYPAIR" | grep -q '"secret"'; then
    ADMIN_SECRET="$(echo "$KEYPAIR" | grep '"secret"' | sed 's/.*"secret"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/')"
    ADMIN_ADDRESS="$(echo "$KEYPAIR" | grep '"public"' | sed 's/.*"public"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/')"
  else
    ADMIN_SECRET="$KEYPAIR"
    ADMIN_ADDRESS="$(stellar keys address --secret-key "$ADMIN_SECRET")"
  fi

  info "Generated admin address: $ADMIN_ADDRESS"
  info "Funding via Friendbot…"
  curl -sf "${FRIENDBOT_URL}?addr=${ADMIN_ADDRESS}" -o /dev/null \
    || die "Friendbot funding failed for $ADMIN_ADDRESS"
  info "Account funded."
fi

# ── Build contracts ───────────────────────────────────────────────────────────

info "Building contracts (release + wasm32)…"
(cd "$CONTRACTS_DIR" && cargo build --release --target wasm32-unknown-unknown --quiet) \
  || die "Cargo build failed"
info "Build complete."

# ── Helper: deploy a contract ─────────────────────────────────────────────────

deploy_contract() {
  local name="$1"
  local wasm="$WASM_DIR/${name}.wasm"

  [[ -f "$wasm" ]] || die "WASM not found: $wasm"

  info "Deploying $name…"
  stellar contract deploy \
    --wasm "$wasm" \
    --source-account "$ADMIN_SECRET" \
    --network "$NETWORK" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    2>/dev/null
}

# ── Deploy all four contracts ─────────────────────────────────────────────────

TREASURY_ID="$(deploy_contract treasury)"
info "Treasury contract: $TREASURY_ID"

PAYROLL_ID="$(deploy_contract payroll_stream)"
info "Payroll contract:  $PAYROLL_ID"

VESTING_ID="$(deploy_contract vesting)"
info "Vesting contract:  $VESTING_ID"

GOVERNANCE_ID="$(deploy_contract governance)"
info "Governance contract: $GOVERNANCE_ID"

# ── Helper: invoke a contract function ────────────────────────────────────────

invoke() {
  stellar contract invoke \
    --source-account "$ADMIN_SECRET" \
    --network "$NETWORK" \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    --id "$1" \
    -- "$2" "${@:3}" \
    2>/dev/null
}

# ── Initialise Treasury ───────────────────────────────────────────────────────

info "Initialising treasury…"
invoke "$TREASURY_ID" initialize \
  --admin "$ADMIN_ADDRESS" \
  --signers "[\"$ADMIN_ADDRESS\"]" \
  --threshold 1 \
|| warn "Treasury initialise returned non-zero (may already be initialised)"

# ── Initialise Payroll Stream ─────────────────────────────────────────────────

info "Initialising payroll stream…"
invoke "$PAYROLL_ID" initialize \
  --admin "$ADMIN_ADDRESS" \
|| warn "Payroll initialise returned non-zero"

# ── Initialise Vesting ────────────────────────────────────────────────────────

info "Initialising vesting…"
invoke "$VESTING_ID" initialize \
  --admin "$ADMIN_ADDRESS" \
|| warn "Vesting initialise returned non-zero"

# ── Initialise Governance ─────────────────────────────────────────────────────

info "Initialising governance…"
invoke "$GOVERNANCE_ID" initialize \
  --admin "$ADMIN_ADDRESS" \
  --members "[\"$ADMIN_ADDRESS\"]" \
  --quorum_percentage 51 \
  --voting_duration 604800 \
  --grace_period 86400 \
|| warn "Governance initialise returned non-zero"

# ── Write .env.local ──────────────────────────────────────────────────────────

info "Writing contract IDs to $ENV_FILE…"

# Preserve any existing lines that are not contract IDs we manage
PRESERVE=""
if [[ -f "$ENV_FILE" ]]; then
  PRESERVE="$(grep -v '^NEXT_PUBLIC_TREASURY_CONTRACT_ID=\|^NEXT_PUBLIC_PAYROLL_CONTRACT_ID=\|^NEXT_PUBLIC_VESTING_CONTRACT_ID=\|^NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID=' "$ENV_FILE" || true)"
fi

{
  [[ -n "$PRESERVE" ]] && echo "$PRESERVE"
  echo "NEXT_PUBLIC_TREASURY_CONTRACT_ID=$TREASURY_ID"
  echo "NEXT_PUBLIC_PAYROLL_CONTRACT_ID=$PAYROLL_ID"
  echo "NEXT_PUBLIC_VESTING_CONTRACT_ID=$VESTING_ID"
  echo "NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID=$GOVERNANCE_ID"
} > "$ENV_FILE"

info "Done! Contract IDs written to frontend/.env.local"
echo
echo "  Treasury:   $TREASURY_ID"
echo "  Payroll:    $PAYROLL_ID"
echo "  Vesting:    $VESTING_ID"
echo "  Governance: $GOVERNANCE_ID"
echo
info "Update CONTRACTS in frontend/src/lib/network.ts or use NEXT_PUBLIC_* vars."
