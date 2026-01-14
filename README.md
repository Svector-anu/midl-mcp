# MIDL MCP Server

A production-ready Model Context Protocol (MCP) server for the [MIDL.js](https://js.midl.xyz) ecosystem. Enables LLMs to interact with Bitcoin and the MIDL Protocol in a safe, inspectable, and AI-native way.

## 🚀 Overview

The MIDL MCP server provides a bridge between LLMs (like Claude) and the Bitcoin network. It follows strict design principles to ensure Bitcoin safety:
- **No Private Keys**: LLMs never hold or access private keys.
- **Human-in-the-Loop**: All signing and broadcasting actions require explicit human confirmation via MCP elicitation.
- **Safety First**: Defaults to Testnet/Regtest and requires a pre-connected wallet model.
- **Transparency**: All transactions are human-readable and decodable before execution.

## ✨ Features

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
- `request-psbt-signature`: Request a human signature for a PSBT (Gated).
- `request-transaction-broadcast`: Request human confirmation to broadcast (Gated).

### Prompts
- `explain-transaction`: Ask the LLM to explain a transaction in plain English.
- `debug-transaction`: Seek help from the LLM to debug a transaction error.

## 🛠 Installation

```bash
git clone https://github.com/svector-anu/midl-mcp.git
cd midl-mcp
pnpm install
```

## 🤖 Integration with Claude Desktop

To use this server in Claude Desktop, add the following to your `claude_desktop_config.json`:

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
      ]
    }
  }
}
```

> [!IMPORTANT]
> Replace `/Users/YOUR_USERNAME/Desktop/opensource/midl-mcp/src/index.ts` with the absolute path to your local `index.ts`.

## 🧪 Testing

```bash
pnpm test
```

## 🛡 Security Architecture

The server enforces a **Pre-connected wallet configuration model**. This means the server instance is initialized with a read-only execution context where the wallet connection is established externally. This prevents the MCP server from having the capability to initiate sessions or manage sensitive keys.

## 📜 License

MIT
