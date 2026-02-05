#!/bin/bash

# Claude Desktop MCP Setup Script for MIDL

CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "🔧 Setting up MIDL MCP for Claude Desktop"
echo ""
echo "Current directory: $CURRENT_DIR"
echo "Config file: $CONFIG_FILE"
echo ""

# Check if config directory exists
CONFIG_DIR="$(dirname "$CONFIG_FILE")"
if [ ! -d "$CONFIG_DIR" ]; then
    echo "❌ Claude Desktop config directory not found: $CONFIG_DIR"
    echo "   Please install Claude Desktop first"
    exit 1
fi

# Create backup if config exists
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Backing up existing config to:"
    echo "   $BACKUP_FILE"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
fi

# Create or update config
cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "midl": {
      "command": "node",
      "args": [
        "-r",
        "tsx/cjs",
        "$CURRENT_DIR/src/index.ts"
      ],
      "env": {
        "MIDL_NETWORK": "staging",
        "MIDL_MNEMONIC": "......"
      }
    }
  }
}
EOF

echo ""
echo "✅ Configuration written!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Edit the config file to add your mnemonic:"
echo "   open \"$CONFIG_FILE\""
echo ""
echo "2. Restart Claude Desktop completely (quit and reopen)"
echo ""
echo "3. In Claude Desktop, you should see 2 new MCP tools:"
echo "   • deploy-contract-source"
echo "   • call-contract"
echo ""
echo "4. Test with a simple deployment:"
echo "   \"Deploy a simple contract that stores a number\""
echo ""
echo "⏱️  Remember: Staging deployments take ~15-20 minutes!"
echo ""
