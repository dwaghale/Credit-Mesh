#!/usr/bin/env bash
#
# CreditMesh deployment script — builds the contract and deploys it to Stellar Testnet.
# Usage: ./scripts/deploy.sh [identity-name]   (default identity: dev)
#
set -euo pipefail

IDENTITY="${1:-dev}"
CONTRACT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../contract" && pwd)"
WASM="$CONTRACT_DIR/target/wasm32v1-none/release/hello_world.wasm"

echo "==> Building contract (cargo -> wasm)…"
(cd "$CONTRACT_DIR" && stellar contract build)

echo "==> Checking identity '$IDENTITY' exists…"
if ! stellar keys address "$IDENTITY" >/dev/null 2>&1; then
  echo "    Identity not found. Creating + funding a new testnet identity '$IDENTITY'…"
  stellar keys generate "$IDENTITY" --network testnet --fund
fi

DEPLOYER=$(stellar keys address "$IDENTITY")
echo "    Deployer: $DEPLOYER"

echo "==> Deploying contract to testnet…"
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source-account "$IDENTITY" \
  --network testnet)

echo "    Contract ID: $CONTRACT_ID"

echo "==> Initializing with the native XLM token (SAC)…"
# CreditMesh REQUIRES initialize(token) to be called once after deployment.
# Without it, every money-moving call (fund_loan, repay, deposit_pool,
# withdraw) traps with Error(WasmVm, InvalidAction).
NATIVE_SAC=$(stellar contract asset id --asset native --network testnet)
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source-account "$IDENTITY" \
  --network testnet \
  -- initialize --token "$NATIVE_SAC"
echo "    Initialized with token: $NATIVE_SAC"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Put the contract id in client/.env.local:"
echo "       NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID"
echo "  2. Regenerate the TypeScript bindings if the contract interface changed:"
echo "       stellar contract bindings typescript --network testnet --id $CONTRACT_ID --output-dir client/packages/contract --overwrite"
