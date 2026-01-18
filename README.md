# MIDL MCP Server

A production-ready Model Context Protocol (MCP) server for the [MIDL.js](https://js.midl.xyz) ecosystem. Enables LLMs to interact with Bitcoin and the MIDL Protocol in a safe, inspectable, and AI-native way.

##  Overview

The MIDL MCP server provides a bridge between LLMs (like Claude) and the Bitcoin network. It follows strict design principles to ensure Bitcoin safety:
- **No Private Keys**: LLMs never hold or access private keys.
- **Human-in-the-Loop**: All signing and broadcasting actions require explicit human confirmation via MCP elicitation.
- **Safety First**: Defaults to Testnet/Regtest and requires a pre-connected wallet model.
- **Transparency**: All transactions are human-readable and decodable before execution.

##  Features

### Resources (Read-Only)
- `midl://balance/{address}`: Current BTC balance.
- `midl://utxos/{address}`: List of unspent transaction outputs.
- `midl://fee-rates`: Current network recommended fees.
- `midl://block-height`: Current Bitcoin block height.
- `midl://network`: Network configuration details.
- `midl://account`: Connected account information.
- `midl://rune/{runeId}`: Rune metadata.
- `midl://rune-balance/{address}/{runeId}`: Rune balance for an address.

### Tools (Analytical & Actionable)
- `estimate-btc-transfer-fee`: Calculate fees for a potential transfer.
- `decode-psbt`: Convert base64 PSBTs into human-readable data.
- `validate-bitcoin-address`: Check address validity for the current network.
- `prepare-btc-transfer`: Prepare an unsigned PSBT (Safe, no action).
- `prepare-contract-deploy`: Prepare a PSBT to anchor an EVM contract deployment.
- `prepare-contract-call`: Prepare a PSBT to anchor a contract function call.
- `deploy-contract-source`: Compile Solidity source code and prepare a deployment PSBT in one step (supports OpenZeppelin).
- `request-psbt-signature`: Request a human signature for a PSBT (Gated).
- `request-transaction-broadcast`: Request human confirmation to broadcast (Gated).

See [DEPLOY_AND_INTERACT.md](./DEPLOY_AND_INTERACT.md) for a detailed walkthrough on smart contract operations.

### Prompts
- `explain-transaction`: Ask the LLM to explain a transaction in plain English.
- `debug-transaction`: Seek help from the LLM to debug a transaction error.

##  Installation

```bash
git clone https://github.com/svector-anu/midl-mcp.git
cd midl-mcp
pnpm install
```

##  Integration with Claude Desktop

To use this server in Claude Desktop, add it to your `claude_desktop_config.json`:

**MacOS**: `~/Library/Application\ Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "midl": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/Users/YOUR_USERNAME/Desktop/opensource/midl-mcp/src/index.ts"
      ],
      "env": {
        "MIDL_NETWORK": "testnet",
        "MIDL_ACCOUNT_ADDRESS": "YOUR_BTC_TESTNET_ADDRESS",
        "MIDL_ACCOUNT_PUBKEY": "YOUR_BTC_PUBLIC_KEY",
        "MIDL_RPC_URL": "https://mempool.space/testnet"
      }
    }
  }
}
```

### Configuration Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `MIDL_NETWORK` | Bitcoin network (testnet, regtest) | `testnet` |
| `MIDL_ACCOUNT_ADDRESS` | Your public Bitcoin address | `tb1q...` |
| `MIDL_ACCOUNT_PUBKEY` | Your public key (32 bytes hex) | `8f2a...` |
| `MIDL_RPC_URL` | Optional custom Mempool.space API | `https://mempool.space/testnet` |

> [!IMPORTANT]
> Replace the paths and values with your real local setup. The `env` section is required for the server to retrieve real wallet data. If `MIDL_ACCOUNT_ADDRESS` is missing, the server falls back to mock data.

##  Testing

```bash
pnpm test
```

##  Security Architecture

The server enforces a **Pre-connected wallet configuration model**. This means the server instance is initialized with a read-only execution context where the wallet connection is established externally. This prevents the MCP server from having the capability to initiate sessions or manage sensitive keys.

## 📜 License

MIT
