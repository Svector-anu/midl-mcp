# Deploy and Interact with Contracts via MIDL MCP

This guide explains how to deploy and interact with Solidity smart contracts on the MIDL network using the Model Context Protocol (MCP) server.

## 🚀 Overview

MIDL enables Ethereum-compatible smart contracts anchored by Bitcoin security. Every deployment or "write" operation on the MIDL L2 requires a Bitcoin anchoring transaction.

With the MIDL MCP server, you can:
1. **Prepare** deployment or call transactions (receives an unsigned PSBT).
2. **Sign** the PSBT (requires human confirmation).
3. **Broadcast** the transaction to the network.

---

## 🏗 Part 1: Deploying a Contract

### 1. Preparation
Ensure you have the compiled contract **bytecode** and the **ABI**.

### 2. Prepare Deployment
Ask the LLM to prepare the deployment.
**Prompt:** `"Deploy this contract with bytecode <BYTECODE> and constructor arguments <ARGS>"`

The LLM will call the `prepare-contract-deploy` tool and return:
- **Predicted Contract Address**: Where the contract will live.
- **PSBT (Base64)**: The unsigned Bitcoin transaction.

### 3. Sign and Broadcast
Following the prepare step, the LLM will guide you through:
1. `request-psbt-signature`: To sign the PSBT.
2. `request-transaction-broadcast`: To send it to the network.

---

## ✍️ Part 2: Interacting with a Contract (Write)

Writing to a contract (changing state) follows the same "Anchoring" pattern.

### 1. Prepare Contract Call
Ask the LLM to call a specific function.
**Prompt:** `"Call the 'setMessage' function on contract <ADDRESS> with argument 'Hello MIDL!'"`

The LLM will call the `prepare-contract-call` tool using the contract's ABI and return a PSBT.

### 2. Gaining Human Approval
The LLM will then request:
1. **Signature**: `request-psbt-signature`.
2. **Broadcast**: `request-transaction-broadcast`.

Once the Bitcoin transaction is confirmed (1 block on Regtest/Testnet), the L2 state will update.

---

## 🛠 Advanced: Manual Setup (Hardhat)

For developers who want to use standard tools, follow the official plugin guide:

### Installation
```bash
pnpm add -D hardhat @midl/hardhat-deploy hardhat-deploy @midl/executor
```

### Configuration (`hardhat.config.ts`)
```typescript
import "@midl/hardhat-deploy";
import "hardhat-deploy";
import { midlRegtest } from "@midl/executor";

const config = {
  solidity: "0.8.28",
  midl: {
    networks: {
      default: {
        mnemonic: process.env.MNEMONIC,
        confirmationsRequired: 1,
        btcConfirmationsRequired: 1,
      },
    },
  },
  networks: {
    default: {
      url: midlRegtest.rpcUrls.default.http[0],
      chainId: midlRegtest.id,
    },
  },
};
export default config;
```

### Deployment Script
```typescript
const deploy = async (hre) => {
  await hre.midl.initialize();
  await hre.midl.deploy("SimpleStorage", { args: ["Hello!"] });
  await hre.midl.execute();
};
export default deploy;
```

---

## 🔍 Verification
After deployment, you can verify the contract on the MIDL Blockscout:
- **Regtest Explorer**: [https://blockscout.regtest.midl.xyz](https://blockscout.regtest.midl.xyz)
- **Bitcoin Explorer**: [https://mempool.regtest.midl.xyz](https://mempool.regtest.midl.xyz)
