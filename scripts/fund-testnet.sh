#!/usr/bin/env bash
# fund-testnet.sh — Create and fund OrbitPay development accounts on Stellar
# Testnet, and optionally deploy a test token for payroll/vesting testing.
#
# Usage:
#   ./scripts/fund-testnet.sh [--token CODE] [--amount STROOPS] [NAME ...]
#
# Arguments:
#   NAME              stellar CLI identity names to create (if missing) and
#                     fund via Friendbot. Defaults to orbitpay-admin,
#                     orbitpay-employer, orbitpay-employee-1, orbitpay-employee-2.
#                     The first name issues the test token.
#
# Options:
#   --token CODE      Issue the asset CODE from the first account, deploy its
#                     Stellar Asset Contract, add trustlines on the other
#                     accounts and mint --amount to each of them. The issuer
#                     is the token admin and can mint more at any time.
#   --amount STROOPS  Amount minted per account (default 10000000000,
#                     i.e. 1,000 tokens at 7 decimals).
#
# Secret keys stay in the stellar CLI keystore (`stellar keys ls`). Use
# `stellar keys address NAME` or `--source-account NAME` to reference them.
#
# Requirements:
#   • stellar CLI  (https://developers.stellar.org/docs/tools/developer-tools/cli)
#   • curl (for Friendbot)

set -euo pipefail

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
FRIENDBOT_URL="https://friendbot.stellar.org"

TOKEN_CODE=""
AMOUNT="10000000000"
NAMES=()

# ── Colours ───────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()     { error "$*"; exit 1; }

# ── Arguments ─────────────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token)  TOKEN_CODE="${2:?--token needs an asset code}"; shift 2 ;;
    --amount) AMOUNT="${2:?--amount needs a value}"; shift 2 ;;
    -h|--help) sed -n '2,26p' "$0"; exit 0 ;;
    -*) die "Unknown option: $1" ;;
    *)  NAMES+=("$1"); shift ;;
  esac
done

[[ ${#NAMES[@]} -gt 0 ]] \
  || NAMES=(orbitpay-admin orbitpay-employer orbitpay-employee-1 orbitpay-employee-2)
[[ -z "$TOKEN_CODE" || "$TOKEN_CODE" =~ ^[A-Za-z0-9]{1,12}$ ]] \
  || die "Asset code must be 1-12 alphanumeric characters: $TOKEN_CODE"
[[ "$AMOUNT" =~ ^[1-9][0-9]*$ ]] || die "--amount must be a positive integer: $AMOUNT"

command -v stellar >/dev/null || die "stellar CLI not found"
command -v curl >/dev/null || die "curl not found"

NET_ARGS=(--network "$NETWORK" --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE")

# ── Helper: fund an account via Friendbot ─────────────────────────────────────

fund_account() {
  local address="$1" body status hash

  body="$(curl -s -w '\n%{http_code}' "${FRIENDBOT_URL}?addr=${address}")" \
    || die "Friendbot request failed for $address"
  status="${body##*$'\n'}"
  body="${body%$'\n'*}"

  if [[ "$status" == "200" ]]; then
    hash="$(echo "$body" | grep -o '"hash": *"[0-9a-f]*"' | head -1 | grep -o '[0-9a-f]\{64\}')"
    info "Funded $address (tx ${hash:-unknown})"
  elif echo "$body" | grep -qE 'createAccountAlreadyExist|already funded'; then
    warn "$address is already funded, skipping"
  else
    die "Friendbot returned HTTP $status for $address: $body"
  fi
}

# ── Accounts ──────────────────────────────────────────────────────────────────

ADDRESSES=()
for name in "${NAMES[@]}"; do
  if ! stellar keys address "$name" >/dev/null 2>&1; then
    info "Generating identity $name…"
    stellar keys generate "$name" >/dev/null \
      || die "stellar keys generate failed for $name"
  fi
  address="$(stellar keys address "$name")"
  ADDRESSES+=("$address")
  fund_account "$address"
done

# ── Test token ────────────────────────────────────────────────────────────────

if [[ -n "$TOKEN_CODE" ]]; then
  ISSUER="${NAMES[0]}"
  ASSET="$TOKEN_CODE:${ADDRESSES[0]}"

  info "Deploying Stellar Asset Contract for $ASSET…"
  TOKEN_ID="$(stellar contract asset deploy --asset "$ASSET" \
      --source-account "$ISSUER" "${NET_ARGS[@]}" 2>/dev/null)" \
    || TOKEN_ID="$(stellar contract id asset --asset "$ASSET" "${NET_ARGS[@]}")" \
    || die "Could not deploy or resolve the token contract for $ASSET"
  info "Token contract: $TOKEN_ID"

  # The issuer mints on demand and cannot hold its own asset, so only the
  # other accounts get a trustline and a balance.
  for ((i = 1; i < ${#NAMES[@]}; i++)); do
    name="${NAMES[$i]}"
    address="${ADDRESSES[$i]}"
    stellar tx new change-trust --source-account "$name" --line "$ASSET" \
      "${NET_ARGS[@]}" >/dev/null \
      || die "Trustline creation failed for $name"
    stellar contract invoke --id "$TOKEN_ID" --source-account "$ISSUER" \
      "${NET_ARGS[@]}" -- mint --to "$address" --amount "$AMOUNT" >/dev/null \
      || die "Mint failed for $name"
    info "Minted $AMOUNT stroops of $TOKEN_CODE to $name"
  done
fi

# ── Summary ───────────────────────────────────────────────────────────────────

echo
for i in "${!NAMES[@]}"; do
  printf '  %-22s %s\n' "${NAMES[$i]}" "${ADDRESSES[$i]}"
done
if [[ -n "$TOKEN_CODE" ]]; then
  printf '  %-22s %s\n' "$TOKEN_CODE token" "$TOKEN_ID"
fi
echo
info "Done. Use the names above as --source-account with the stellar CLI."
