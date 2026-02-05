#!/bin/bash
# Quick script to deploy and verify a test contract

cd midl-example

echo "🚀 Deploying SimpleStorage contract..."
MNEMONIC="wreck ankle thumb market churn focus minute cream vault corn rug gown" \
  npx hardhat deploy --network regtest --tags simple 2>&1 | tee /tmp/deploy.log

# Extract contract address from deployment output
CONTRACT_ADDRESS=$(grep -o "0x[a-fA-F0-9]\{40\}" /tmp/deploy.log | tail -1)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Deployment failed or address not found"
    exit 1
fi

echo ""
echo "✅ Contract deployed at: $CONTRACT_ADDRESS"
echo ""
echo "⏳ Waiting 10 seconds for transaction to settle..."
sleep 10

echo "🔍 Verifying contract..."
MNEMONIC="wreck ankle thumb market churn focus minute cream vault corn rug gown" \
  npx hardhat verify --network regtest "$CONTRACT_ADDRESS"

echo ""
echo "✅ Done! Check: https://blockscout.staging.midl.xyz/address/$CONTRACT_ADDRESS"
