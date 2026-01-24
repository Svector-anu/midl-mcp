# MIDL MCP Server

A production-ready Model Context Protocol (MCP) server for the [MIDL.js](https://js.midl.xyz) ecosystem. Enables LLMs to interact with Bitcoin and deploy smart contracts to MIDL L2 (Bitcoin-anchored EVM) in a safe, inspectable, and AI-native way.

##  Quick Start

1. **Install dependencies:**
```bash
git clone https://github.com/Svector-anu/midl-mcp.git
cd midl-mcp
pnpm install
```

2. **Configure Claude Desktop** with your mnemonic (see [Configuration](#configuration) below)

3. **Get test BTC** from the [MIDL Faucet](https://faucet.regtest.midl.xyz/) (for regtest)

4. **Start deploying:** Just ask Claude to deploy a contract!

 **Full deployment guide:** [DEPLOY_AND_INTERACT.md](./DEPLOY_AND_INTERACT.md)
 **Testing guide:** [FEATURE_TESTING_GUIDE.md](./FEATURE_TESTING_GUIDE.md)
 **Real example:** [EXAMPLE_DEPLOYMENT.md](./EXAMPLE_DEPLOYMENT.md)

---

##  Features

###  Smart Contract Operations
- **`deploy-contract-source`** - Compile & deploy Solidity (auto-resolves OpenZeppelin imports)
- **`call-contract`** - Call functions on deployed contracts (handles BTC anchoring)
- **`verify-contract`** - Verify source code on Blockscout explorer

###  Bitcoin Wallet Operations
- **`get-wallet-balance`** - Check BTC balance
- **`prepare-btc-transfer`** - Create unsigned PSBT for transfers
- **`broadcast-transaction`** - Broadcast signed transactions
- **`estimate-btc-transfer-fee`** - Calculate transaction costs

###  Blockchain Information
- **`get-address-transactions`** - View transaction history
- **`get-blockchain-info`** - Network status and info
- **`decode-psbt`** - Inspect PSBT details
- **`validate-bitcoin-address`** - Validate address format

###  Resources (Read-Only)
- `midl://balance/{address}` - Current BTC balance
- `midl://utxos/{address}` - Unspent transaction outputs
- `midl://fee-rates` - Current network fees
- `midl://block-height` - Current block height
- `midl://network` - Network configuration
- `midl://account` - Connected account info

---

##  Configuration

### Claude Desktop Setup

Add this to your `claude_desktop_config.json`:

**MacOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "midl-bitcoin": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/midl-mcp/src/index.ts"],
      "env": {
        "MIDL_NETWORK": "regtest",
        "MIDL_MNEMONIC": "your twelve word mnemonic phrase here"
      }
    }
  }
}
```

### Configuration Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MIDL_NETWORK` | Bitcoin network | `regtest`, `testnet`, `mainnet` | Yes |
| `MIDL_MNEMONIC` | Your wallet mnemonic (12 or 24 words) | `word1 word2 word3 ...` | Yes |
| `MIDL_RPC_URL` | Optional custom RPC endpoint | `https://mempool.space/testnet` | No |

**Features:**
-  Automatic transaction signing
-  Contract deployment
-  Contract interaction
-  BTC transfers
-  Full read/write access

> ** Security Note:** Your mnemonic never leaves your machine. It's only used by the local MCP server to sign transactions. The MCP protocol ensures Claude cannot access environment variables directly.

### Important Setup Steps

1. **Replace `/path/to/midl-mcp`** with your actual installation path
2. **Use your real mnemonic** from Xverse or another Bitcoin wallet
3. **Restart Claude Desktop** completely (Cmd+Q on Mac, then reopen)
4. **Get test funds** from [https://regtest.midl.xyz](https://regtest.midl.xyz) (for regtest)

---

##  Usage Examples

### Deploy a Contract

**Ask Claude:**
```
Deploy this contract:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract Counter {
    uint256 public count;
    function increment() public { count++; }
}
```

### Interact with Contract

**Ask Claude:**
```
Call increment() on contract 0xYourContractAddress
```

### Check Balance

**Ask Claude:**
```
What's my BTC balance?
```

### Estimate Fees

**Ask Claude:**
```
How much would it cost to send 0.001 BTC to bcrt1q...?
```

See [FEATURE_TESTING_GUIDE.md](./FEATURE_TESTING_GUIDE.md) for 12 complete test scenarios.

---

##  Architecture

### MIDL L2 Deployment Flow

MIDL is a Bitcoin-anchored EVM. Contract deployments require:

1. **BTC Transaction** - Anchors the operation to Bitcoin
2. **EVM Transaction** - Contains the contract bytecode
3. **BIP322 Signature** - Links EVM tx to BTC txId
4. **Combined Submission** - Both sent via `eth_sendBTCTransactions`

The MCP server handles this complete flow automatically!

### How It Works

```
┌─────────────┐
│   Claude    │  "Deploy this contract"
└──────┬──────┘
       │
       v
┌─────────────────────┐
│   MCP Server        │
│  1. Compile Solidity │ (resolves @openzeppelin imports)
│  2. Create BTC tx    │ (anchors to Bitcoin)
│  3. Sign EVM tx      │ (with BIP322)
│  4. Submit both      │ (eth_sendBTCTransactions)
│  5. Verify contract  │ (on Blockscout)
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│  MIDL L2 Network    │
│  Bitcoin + EVM      │
└─────────────────────┘
```

---

##  Testing

Run the test suite:
```bash
pnpm test
```

Manual testing with Claude Desktop:
```bash
# Follow the testing guide
cat FEATURE_TESTING_GUIDE.md
```

---

##  Network Resources

### Regtest (Testing)
- **Faucet:** [https://regtest.midl.xyz](https://faucet.regtest.midl.xyz)
- **Bitcoin Explorer:** [https://mempool.regtest.midl.xyz](https://mempool.regtest.midl.xyz)
- **EVM Explorer:** [https://blockscout.regtest.midl.xyz](https://blockscout.regtest.midl.xyz)
- **EVM RPC:** [https://rpc.regtest.midl.xyz](https://rpc.regtest.midl.xyz)

### Testnet
- **Bitcoin Explorer:** [https://mempool.space/testnet](https://mempool.space/testnet)
- **Faucet:** Use external Bitcoin testnet faucets

---

##  Security

### Design Principles

- **No Private Keys in Memory:** The server never stores private keys
- **Mnemonic-based Signing:** Uses `@midl/node` for secure transaction signing
- **Human-in-the-Loop:** All actions require explicit user confirmation via Claude
- **Testnet First:** Defaults to testnet/regtest for safety
- **Transparent Operations:** All transactions are human-readable

### Security Architecture

The server uses a **pre-connected wallet configuration model**:
- Wallet connection established externally (via mnemonic)
- Server operates in read-only execution context for queries
- Write operations require explicit tool invocation
- MCP protocol prevents direct environment variable access

### Best Practices

1. **Use testnet/regtest first** before mainnet
2. **Review all transactions** before confirmation
3. **Keep your mnemonic secure** and never share it
4. **Use dedicated test wallets** for development
5. **Verify contract addresses** on block explorers

---

##  Documentation

- **[Deployment Guide](./DEPLOY_AND_INTERACT.md)** - Complete walkthrough
- **[Testing Guide](./FEATURE_TESTING_GUIDE.md)** - Test all 12 tools
- **[Real Example](./EXAMPLE_DEPLOYMENT.md)** - Counter contract deployment
- **[MIDL JS SDK](https://js.midl.xyz)** - Core SDK documentation

---

##  Troubleshooting

### "No account connected"
**Solution:** Check `MIDL_MNEMONIC` in Claude Desktop config

### "Insufficient funds"
**Solution:** Get test BTC from [https://regtest.midl.xyz](https://faucet.regtest.midl.xyz)

### Contract not appearing on explorer
**Solution:** Wait 1-2 minutes for Bitcoin block confirmation

### "Method not found" on signature
**Solution:** Ensure you're using `MIDL_MNEMONIC` in your configuration

### Claude doesn't see the tools
**Solution:** Restart Claude Desktop completely (Cmd+Q on Mac, then reopen)

---

##  Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

---

##  License

MIT

---

##  Links

- **GitHub:** [https://github.com/Svector-anu/midl-mcp](https://github.com/Svector-anu/midl-mcp)
- **MIDL Website:** [https://midl.xyz](https://midl.xyz)
- **MIDL SDK:** [https://js.midl.xyz](https://js.midl.xyz)
- **Documentation:** [https://js.midl.xyz/guides/deploy-contract](https://js.midl.xyz/guides/deploy-contract)

---

**Built for midl.xyz **
