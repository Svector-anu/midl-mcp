---
name: midl-deploy-starter
description: Deploy MIDL example contracts using the official smart-contract-deploy-starter repository
---

# MIDL Deploy Starter Skill

## Overview
This Skill helps you deploy example contracts from the official MIDL smart-contract-deploy-starter repository. It includes system contracts (Base, Proxies), example applications (MessageBoard, Runes), and proper configuration for the MIDL staging network.

## When to Use This Skill

Apply this Skill whenever:
- User wants to deploy example contracts from the deploy-starter repo
- User is learning MIDL deployment patterns
- User needs reference implementations for Base/Proxy contracts
- User is troubleshooting system contract issues
- User wants to test MIDL deployment with working examples

## Repository Information

**Official Repo:** https://github.com/midl-xyz/smart-contract-deploy-starter

**What's Included:**
- System contracts (Base, Proxies)
- Example applications (MessageBoard)
- Runes integration examples
- Pre-configured Hardhat setup
- Working deployment scripts

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/midl-xyz/smart-contract-deploy-starter.git
cd smart-contract-deploy-starter

# Install dependencies
pnpm install

# Create .env file
cp .env.example .env
# Add your MNEMONIC to .env
```

### 2. Verify Configuration

**CRITICAL: Check package.json has viem override:**
```json
{
  "pnpm": {
    "overrides": {
      "viem": "npm:@midl/viem@2.21.39"
    }
  }
}
```

**If missing, add it and reinstall:**
```bash
# Add to package.json manually
pnpm install --force
```

### 3. Deploy Example Contracts

```bash
# Deploy Base system contracts
npx hardhat deploy --network regtest --tags Base

# Deploy Proxies
npx hardhat deploy --network regtest --tags Proxies

# Deploy MessageBoard example
npx hardhat deploy --network regtest --tags MessageBoard

# Deploy Runes integration
npx hardhat deploy --network regtest --tags Runes-Usage
```

## Network Configuration

**MIDL Staging Network (REQUIRED):**
- RPC: `https://rpc.staging.midl.xyz`
- Chain ID: `15001` (0x3a99)
- Bitcoin Explorer: `https://mempool.staging.midl.xyz`
- EVM Explorer: `https://blockscout.staging.midl.xyz`
- Bitcoin Network: Regtest

**⚠️ IMPORTANT:** Use **staging RPC**, NOT regtest RPC!

**Why?**
- Staging has Executor system contracts deployed
- Regtest RPC is missing system contract at `0x0000000000000000000000000000000000001006`
- Without system contracts, deployments fail with "btcFeeRate returned no data"

## Critical Configuration Requirements

### 1. Viem Override (MOST IMPORTANT!)

**Must be in package.json:**
```json
{
  "pnpm": {
    "overrides": {
      "viem": "npm:@midl/viem@2.21.39"
    }
  }
}
```

**Why it's critical:**
- Standard `viem` lacks `estimateGasMulti` method
- MIDL deployments need custom viem fork
- Without this: gas estimation hangs/fails
- **This is the #1 cause of deployment failures**

**Verify it's working:**
```bash
pnpm list viem
# Should show: viem -> @midl/viem@2.21.39
```

### 2. Hardhat Configuration

The deploy-starter repo comes pre-configured, but verify these settings:

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
  networks: {
    regtest: {
      url: "https://rpc.staging.midl.xyz",  // ✅ Staging RPC!
      accounts: {
        mnemonic: process.env.MNEMONIC,
        path: "m/86'/1'/0'/0/0",
      },
      chainId: 15001,
    },
  },
  midl: {
    networks: {
      regtest: {
        mnemonic: process.env.MNEMONIC,
        confirmationsRequired: 1,
        btcConfirmationsRequired: 1,
        hardhatNetwork: "regtest",
        network: {
          explorerUrl: "https://mempool.staging.midl.xyz",
          id: "regtest",
          network: "regtest",
        },
        providerFactory: () =>
          new MempoolSpaceProvider({
            regtest: "https://mempool.staging.midl.xyz",
          }),
        runesProviderFactory: () =>
          new MaestroSymphonyProvider({
            regtest: "https://runes.staging.midl.xyz",
          }),
      },
    },
  },
};
```

### 3. Environment Variables

Create `.env` file:
```env
MNEMONIC="your twelve word mnemonic phrase here from xverse or leather wallet"
```

**Important:**
- Use your actual Bitcoin wallet mnemonic
- This enables automatic transaction signing
- Mnemonic never leaves your machine
- Required for both BTC and EVM transactions

## Performance Expectations

**Staging Network Timing:**
- ⚡ **Contract Deployment:** 30 seconds - 2 minutes
- ⏳ **Write Operations:** 8-15 minutes per transaction
- ⚡ **Read Operations:** Instant

**Important:** Write operations appearing to "hang" for 10-15 minutes is **NORMAL** on staging!

**What to do when it hangs:**
- ✅ Be patient - it's working
- ✅ Check Blockscout: `https://blockscout.staging.midl.xyz`
- ✅ Check Mempool: `https://mempool.staging.midl.xyz`
- ✅ Don't kill the process
- ⏳ Wait up to 15 minutes

## Example Contracts in Deploy Starter

### 1. Base Contracts (System)
**Script:** `deploy/000_deploy_Base.ts`
**Tag:** `Base`

System-level base contracts for MIDL infrastructure.

```bash
npx hardhat deploy --network regtest --tags Base
```

### 2. Proxies (System)
**Script:** `deploy/000_deploy_Proxies.ts`
**Tag:** `Proxies`

Proxy pattern contracts for upgradeable deployments.

```bash
npx hardhat deploy --network regtest --tags Proxies
```

### 3. MessageBoard (Example App)
**Script:** `deploy/002_deploy_message_board.ts`
**Tag:** `MessageBoard`

A simple message board contract that demonstrates:
- Contract deployment
- Write operations (posting messages)
- Reading data on-chain

```bash
npx hardhat deploy --network regtest --tags MessageBoard
```

**What it does:**
1. Deploys MessageBoard contract
2. Posts a welcome message automatically
3. Shows both deployment and write operation flows

### 4. Runes Integration
**Script:** `deploy/000_deploy_Runes-Usage.ts`
**Tag:** `Runes-Usage`

Demonstrates Bitcoin Runes integration with MIDL.

```bash
npx hardhat deploy --network regtest --tags Runes-Usage
```

## Deployment Workflow

### Standard Deployment Pattern

All deploy-starter scripts follow this pattern:

```typescript
export default async function deploy(hre: HardhatRuntimeEnvironment) {
  console.log('📝 Deploying Contract...');

  // 1. Initialize MIDL
  await hre.midl.initialize();
  console.log(`✅ Initialized (Address: ${hre.midl.account.address})`);

  // 2. Deploy the contract
  await hre.midl.deploy('ContractName', [constructorArgs]);
  console.log('✅ Contract staged for deployment');

  // 3. Execute the deployment (submits BTC + EVM transactions)
  console.log('📡 Executing deployment transaction...');
  await hre.midl.execute();

  // 4. Get deployment info
  const deployment = await hre.midl.getDeployment('ContractName');
  console.log(`Contract Address: ${deployment.address}`);
  console.log(`BTC TX: https://mempool.staging.midl.xyz/tx/${deployment.btcTxId}`);
  console.log(`Blockscout: https://blockscout.staging.midl.xyz/address/${deployment.address}`);
}

deploy.tags = ['ContractName'];
```

### Write Operation Pattern

For calling functions after deployment:

```typescript
// After deployment, call a function
await hre.midl.write('ContractName', 'functionName', [arg1, arg2]);
console.log('📡 Executing transaction...');
await hre.midl.execute();
console.log('✅ Function executed!');
```

## System Contracts Deep Dive

### What are System Contracts?

System contracts are pre-deployed contracts on MIDL that provide core functionality:

**Executor Contract:**
- Address: `0x0000000000000000000000000000000000001006`
- Handles BTC fee rate queries
- Manages BTC transaction anchoring
- Critical for all deployments and writes

**Why Staging vs Regtest?**
- ✅ **Staging:** Has Executor deployed at 0x...1006
- ❌ **Regtest:** Missing Executor contract
- Without Executor: All deployments fail

### System Contract Error

**Symptom:**
```
Error: The contract function "btcFeeRate" returned no data ("0x")
Contract Call: address: 0x0000000000000000000000000000000000001006
```

**Cause:** Using regtest RPC which lacks system contracts

**Fix:** Change to staging RPC:
```typescript
url: "https://rpc.staging.midl.xyz"  // Not rpc.regtest.midl.xyz
```

## Troubleshooting

### 1. Deployment Hangs Immediately

**Symptom:** Hangs at "Executing transaction..." right away (not after 5+ minutes)

**Cause:** Missing viem override

**Fix:**
```bash
# 1. Add viem override to package.json
# 2. Delete node_modules and pnpm-lock.yaml
rm -rf node_modules pnpm-lock.yaml

# 3. Reinstall
pnpm install

# 4. Verify
pnpm list viem  # Should show @midl/viem
```

### 2. Deployment Hangs for 10+ Minutes

**Symptom:** Long wait after "Executing transaction..."

**Cause:** This is **NORMAL** on staging network!

**Fix:**
- Wait patiently (up to 15 minutes)
- Check Blockscout to see if transaction appeared
- Check Mempool for Bitcoin transaction
- Don't kill the process - it's working!

### 3. "btcFeeRate returned no data"

**Symptom:**
```
Error: The contract function "btcFeeRate" returned no data
```

**Cause:** Using wrong RPC (regtest instead of staging)

**Fix:**
```typescript
// hardhat.config.ts
networks: {
  regtest: {
    url: "https://rpc.staging.midl.xyz",  // ✅ Correct
    // url: "https://rpc.regtest.midl.xyz",  // ❌ Wrong
  }
}
```

### 4. "No selected UTXOs" or Insufficient Funds

**Symptom:**
```
Error: No selected UTXOs
```

**Cause:** Wallet has no BTC balance

**Fix:**
```bash
# 1. Check your BTC address
npx hardhat midl:address 0 --network regtest

# 2. Get test BTC
# Request from MIDL team or use faucet (if available)

# 3. Verify balance
curl "https://mempool.staging.midl.xyz/api/address/YOUR_BTC_ADDRESS"
```

### 5. Contract Not Found After Deployment

**Symptom:** Deployment succeeded but contract not on Blockscout

**Cause:** Still confirming on Bitcoin network

**Fix:**
- Wait 1-2 minutes for Bitcoin confirmation
- Check Mempool for BTC transaction status
- Once confirmed, refresh Blockscout

### 6. Import Errors or Missing Dependencies

**Symptom:**
```
Error: Cannot find module '@midl/hardhat-deploy'
```

**Fix:**
```bash
# Reinstall dependencies
pnpm install

# If still failing, check package.json has:
# "@midl/hardhat-deploy": "3.0.0-next.29" or latest
```

## Best Practices

1. **Always use staging RPC** - It has system contracts
2. **Always include viem override** - Critical for gas estimation
3. **Be patient with writes** - 10-15 min is normal
4. **Check Blockscout often** - Monitor transaction status
5. **One deployment at a time** - Don't run multiple deploys simultaneously
6. **Document addresses** - Save deployed contract addresses
7. **Test locally first** - Use hardhat console to test logic

## Verification After Deployment

Contracts can be verified on Blockscout:

```bash
# Basic verification
npx hardhat verify --network regtest <CONTRACT_ADDRESS>

# With constructor args
npx hardhat verify --network regtest <CONTRACT_ADDRESS> "arg1" "arg2"
```

**Important:**
- Use exact pragma versions (e.g., `0.8.24`, not `^0.8.24`)
- Match compiler settings from hardhat.config.ts
- Constructor args must match deployment exactly

See the **Contract Verification** Skill for detailed help.

## Successful Test Deployments

The following contracts have been successfully deployed using this repo:

| Contract | Type | Status | Explorer |
|----------|------|--------|----------|
| Base | System | ✅ Deployed | Staging Blockscout |
| Proxies | System | ✅ Deployed | Staging Blockscout |
| MessageBoard | Example | ✅ Deployed & Verified | Staging Blockscout |
| Runes Integration | Example | ✅ Deployed | Staging Blockscout |

All viewable on: https://blockscout.staging.midl.xyz

## How MIDL Deployment Works

MIDL is a Bitcoin-anchored EVM. Each deployment requires:

1. **EVM Transaction:** Contract deployment bytecode
2. **Bitcoin Transaction:** Anchors the EVM tx to Bitcoin L1
3. **BIP322 Signature:** Links EVM tx to BTC tx
4. **eth_sendBTCTransactions:** Special RPC submitting both together

The `@midl/hardhat-deploy` plugin handles all of this automatically through:
- `hre.midl.deploy()` - Stages the deployment
- `hre.midl.execute()` - Submits BTC + EVM transactions together

## Quick Reference Commands

```bash
# Setup
git clone https://github.com/midl-xyz/smart-contract-deploy-starter.git
cd smart-contract-deploy-starter
pnpm install
cp .env.example .env  # Add your MNEMONIC

# Deploy examples
npx hardhat deploy --network regtest --tags Base
npx hardhat deploy --network regtest --tags MessageBoard
npx hardhat deploy --network regtest --tags Runes-Usage

# Check address
npx hardhat midl:address 0 --network regtest

# Check balance
curl "https://mempool.staging.midl.xyz/api/address/YOUR_BTC_ADDRESS"

# Verify contract
npx hardhat verify --network regtest <ADDRESS> [args...]

# View on explorers
open "https://blockscout.staging.midl.xyz/address/<ADDRESS>"
open "https://mempool.staging.midl.xyz/tx/<BTC_TX_ID>"
```

## Resources

- **Deploy Starter Repo:** https://github.com/midl-xyz/smart-contract-deploy-starter
- **MIDL JS Docs:** https://js.midl.xyz
- **Deployment Guide:** `MIDL_DEPLOYMENT_GUIDE.md`
- **Verification Guide:** `CONTRACT_VERIFICATION_GUIDE.md`
- **MIDL Documentation:** midl-js/apps/docs

## Related Skills

- **contract-deployment** - General MIDL deployment guidance
- **contract-verification** - Verifying contracts on Blockscout
