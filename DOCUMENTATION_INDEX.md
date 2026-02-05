# MIDL MCP Documentation Index

Complete guide to all MIDL MCP server documentation.

**Last Updated:** 2026-02-05

---

## 📚 Documentation Overview

### Quick Navigation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[README.md](./README.md)** | Project overview and setup | First-time setup |
| **[MCP_TOOLS_GUIDE.md](./MCP_TOOLS_GUIDE.md)** | **⭐ All 14 tools** | Reference for any tool |
| **[CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md)** | Verification method | After deployment |
| **[EXAMPLE_DEPLOYMENT.md](./EXAMPLE_DEPLOYMENT.md)** | Real-world example | Learning workflow |
| **[FEATURE_TESTING_GUIDE.md](./FEATURE_TESTING_GUIDE.md)** | Test scenarios | QA and testing |
| **[skills/README.md](./skills/README.md)** | Claude Skills | Uploading to Claude Desktop |

---

## 🚀 Getting Started Path

### 1. Setup (First Time)
→ **[README.md](./README.md)** - Quick Start section
- Install dependencies
- Configure Claude Desktop
- Get test BTC from faucet
- Verify setup

### 2. Learn the Tools
→ **[MCP_TOOLS_GUIDE.md](./MCP_TOOLS_GUIDE.md)** - Complete reference
- All 14 tools documented
- Examples for each tool
- Use cases and patterns
- Best practices

### 3. Try a Real Example
→ **[EXAMPLE_DEPLOYMENT.md](./EXAMPLE_DEPLOYMENT.md)** - Counter contract
- Step-by-step deployment
- Real addresses and transactions
- Timing expectations
- Verification workflow

### 4. Verify Contracts
→ **[CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md)** - 100% success method
- Hardhat verification (proven)
- Bytecode decoding
- Troubleshooting
- Examples

### 5. Test Everything
→ **[FEATURE_TESTING_GUIDE.md](./FEATURE_TESTING_GUIDE.md)** - 13 test scenarios
- All tools tested
- Expected results
- Performance benchmarks
- Verified contracts

### 6. Add Claude Skills
→ **[skills/README.md](./skills/README.md)** - Upload to Claude Desktop
- Contract verification skill
- Contract deployment skill
- Installation instructions

---

## 📖 Documentation by Topic

### Smart Contract Deployment

**Primary Guide:** [MCP_TOOLS_GUIDE.md - deploy-contract-source](./MCP_TOOLS_GUIDE.md#10-deploy-contract-source)

**Related Docs:**
- [EXAMPLE_DEPLOYMENT.md](./EXAMPLE_DEPLOYMENT.md) - Real deployment example
- [FEATURE_TESTING_GUIDE.md - Test 1](./FEATURE_TESTING_GUIDE.md) - Deployment test
- [skills/contract-deployment](./skills/README.md) - Deployment skill

**What You'll Learn:**
- How to deploy Solidity contracts
- Constructor arguments
- OpenZeppelin imports
- Timing expectations
- Verification workflow

---

### Contract Verification

**Primary Guide:** [CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md)

**Related Docs:**
- [MCP_TOOLS_GUIDE.md - verify-contract](./MCP_TOOLS_GUIDE.md#13-verify-contract) - Tool reference
- [EXAMPLE_DEPLOYMENT.md - Step 2](./EXAMPLE_DEPLOYMENT.md#step-2-verify-the-contract-recommended) - Real verification
- [skills/contract-verification](./skills/README.md) - Verification skill

**What You'll Learn:**
- Why Hardhat verification works (100%)
- Why MCP verification doesn't
- Bytecode decoding
- Pragma version matching
- Troubleshooting tips

---

### Contract Interaction

**Primary Guide:** [MCP_TOOLS_GUIDE.md - call-contract](./MCP_TOOLS_GUIDE.md#11-call-contract)

**Related Docs:**
- [EXAMPLE_DEPLOYMENT.md - Steps 3-7](./EXAMPLE_DEPLOYMENT.md#step-3-check-initial-count) - Real interactions
- [FEATURE_TESTING_GUIDE.md - Test 2](./FEATURE_TESTING_GUIDE.md) - Call contract test

**What You'll Learn:**
- Read vs write operations
- Function arguments
- Payable functions
- Confirmation times
- Transaction monitoring

---

### Bitcoin Transfers

**Primary Guide:** [MCP_TOOLS_GUIDE.md - Bitcoin Transaction Tools](./MCP_TOOLS_GUIDE.md#bitcoin-transaction-tools)

**Related Docs:**
- [FEATURE_TESTING_GUIDE.md - Tests 5-9](./FEATURE_TESTING_GUIDE.md) - BTC transfer tests
- [MCP_TOOLS_GUIDE.md - Workflow 2](./MCP_TOOLS_GUIDE.md#workflow-2-check-balance-and-send-btc) - Complete workflow

**What You'll Learn:**
- Prepare PSBT
- Estimate fees
- Sign transactions
- Broadcast transactions
- Decode PSBT details

---

### Wallet & Balance

**Primary Guide:** [MCP_TOOLS_GUIDE.md - Wallet Operations](./MCP_TOOLS_GUIDE.md#wallet--balance-tools)

**Related Docs:**
- [FEATURE_TESTING_GUIDE.md - Tests 3-4](./FEATURE_TESTING_GUIDE.md) - Wallet tests
- [README.md - Configuration](./README.md#-configuration) - Wallet setup

**What You'll Learn:**
- Check balances
- Validate addresses
- View transactions
- Account management

---

### Blockchain Information

**Primary Guide:** [MCP_TOOLS_GUIDE.md - Blockchain Information](./MCP_TOOLS_GUIDE.md#blockchain-information-tools)

**Related Docs:**
- [FEATURE_TESTING_GUIDE.md - Tests 11-13](./FEATURE_TESTING_GUIDE.md) - Info tests
- [README.md - Network Resources](./README.md#-network-resources) - Network endpoints

**What You'll Learn:**
- Check network status
- View transaction history
- Monitor fees
- Block height

---

## 🎯 Use Case Guides

### I want to deploy my first contract
1. Read: [README.md - Quick Start](./README.md#-quick-start)
2. Follow: [EXAMPLE_DEPLOYMENT.md](./EXAMPLE_DEPLOYMENT.md)
3. Reference: [MCP_TOOLS_GUIDE.md - deploy-contract-source](./MCP_TOOLS_GUIDE.md#10-deploy-contract-source)

### I want to verify a deployed contract
1. Read: [CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md)
2. Follow: [EXAMPLE_DEPLOYMENT.md - Step 2](./EXAMPLE_DEPLOYMENT.md#step-2-verify-the-contract-recommended)

### I want to interact with a contract
1. Read: [MCP_TOOLS_GUIDE.md - call-contract](./MCP_TOOLS_GUIDE.md#11-call-contract)
2. Follow: [EXAMPLE_DEPLOYMENT.md - Steps 3-7](./EXAMPLE_DEPLOYMENT.md#step-3-check-initial-count)

### I want to send Bitcoin
1. Read: [MCP_TOOLS_GUIDE.md - Bitcoin Transfers](./MCP_TOOLS_GUIDE.md#bitcoin-transaction-tools)
2. Follow: [MCP_TOOLS_GUIDE.md - Workflow 2](./MCP_TOOLS_GUIDE.md#workflow-2-check-balance-and-send-btc)

### I want to test all features
1. Read: [FEATURE_TESTING_GUIDE.md](./FEATURE_TESTING_GUIDE.md)
2. Follow: All 13 test scenarios

### I want to add Claude Skills
1. Read: [skills/README.md](./skills/README.md)
2. Upload: `contract-verification.zip` and `contract-deployment.zip`

---

## 🔍 Finding Information

### By Tool Name

All tools documented in **[MCP_TOOLS_GUIDE.md](./MCP_TOOLS_GUIDE.md)**:

**Smart Contracts:**
- `deploy-contract-source` - Section 10
- `call-contract` - Section 11
- `prepare-contract-deploy` - Section 12
- `verify-contract` - Section 13

**Bitcoin:**
- `prepare-btc-transfer` - Section 5
- `estimate-btc-transfer-fee` - Section 6
- `request-psbt-signature` - Section 8
- `request-transaction-broadcast` - Section 9 (referenced in 8)
- `broadcast-transaction` - Section 9

**Blockchain:**
- `get-blockchain-info` - Section 1
- `get-address-transactions` - Section 2

**Wallet:**
- `get-wallet-balance` - Section 3
- `validate-bitcoin-address` - Section 4

**PSBT:**
- `decode-psbt` - Section 7

### By Error Message

**"Bytecode doesn't match"**
→ [CONTRACT_VERIFICATION_GUIDE.md - Troubleshooting](./CONTRACT_VERIFICATION_GUIDE.md)

**"No account connected"**
→ [README.md - Troubleshooting](./README.md#-troubleshooting)

**"Insufficient funds"**
→ [README.md - Troubleshooting](./README.md#-troubleshooting)

**"Transaction pending/hanging"**
→ [MCP_TOOLS_GUIDE.md - Troubleshooting](./MCP_TOOLS_GUIDE.md#troubleshooting)
→ [EXAMPLE_DEPLOYMENT.md - Timing](./EXAMPLE_DEPLOYMENT.md#key-insights)

### By Network

**Staging:**
- [MCP_TOOLS_GUIDE.md - Network Configuration](./MCP_TOOLS_GUIDE.md#network-configuration)
- [EXAMPLE_DEPLOYMENT.md](./EXAMPLE_DEPLOYMENT.md) - All examples on staging
- [FEATURE_TESTING_GUIDE.md](./FEATURE_TESTING_GUIDE.md) - Staging benchmarks

**Regtest:**
- [README.md - Network Resources](./README.md#-network-resources)
- [MCP_TOOLS_GUIDE.md - Performance](./MCP_TOOLS_GUIDE.md#performance-benchmarks)

---

## 📊 Documentation Stats

### Coverage
- **Total Tools:** 14
- **Documented Tools:** 14 (100%)
- **Example Workflows:** 5
- **Test Scenarios:** 13
- **Verified Contracts:** 5
- **Success Rate:** 100%

### File Sizes
- **MCP_TOOLS_GUIDE.md:** ~500 lines (comprehensive)
- **CONTRACT_VERIFICATION_GUIDE.md:** ~450 lines
- **EXAMPLE_DEPLOYMENT.md:** ~500 lines
- **FEATURE_TESTING_GUIDE.md:** ~450 lines
- **README.md:** ~300 lines

### Last Updated
- All guides: 2026-02-05
- Network: MIDL Staging
- Chain ID: 15001

---

## 🎓 Learning Paths

### Beginner Path
1. [README.md](./README.md) - Setup
2. [EXAMPLE_DEPLOYMENT.md](./EXAMPLE_DEPLOYMENT.md) - Follow along
3. [MCP_TOOLS_GUIDE.md](./MCP_TOOLS_GUIDE.md) - Learn tools

### Intermediate Path
1. [MCP_TOOLS_GUIDE.md](./MCP_TOOLS_GUIDE.md) - All tools
2. [CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md) - Verification
3. [FEATURE_TESTING_GUIDE.md](./FEATURE_TESTING_GUIDE.md) - Test everything

### Advanced Path
1. [MCP_TOOLS_GUIDE.md - Workflows](./MCP_TOOLS_GUIDE.md#common-workflows) - Complex patterns
2. [CONTRACT_VERIFICATION_GUIDE.md - Bytecode](./CONTRACT_VERIFICATION_GUIDE.md) - Deep dive
3. Create your own contracts and deploy

---

## 🆘 Need Help?

### Quick Answers
→ [README.md - Troubleshooting](./README.md#-troubleshooting)
→ [MCP_TOOLS_GUIDE.md - Troubleshooting](./MCP_TOOLS_GUIDE.md#troubleshooting)

### Verification Issues
→ [CONTRACT_VERIFICATION_GUIDE.md](./CONTRACT_VERIFICATION_GUIDE.md)

### Network Issues
→ [MCP_TOOLS_GUIDE.md - Network Configuration](./MCP_TOOLS_GUIDE.md#network-configuration)

### Still Stuck?
- Check [GitHub Issues](https://github.com/Svector-anu/midl-mcp/issues)
- Review all test scenarios in [FEATURE_TESTING_GUIDE.md](./FEATURE_TESTING_GUIDE.md)
- Compare with working example in [EXAMPLE_DEPLOYMENT.md](./EXAMPLE_DEPLOYMENT.md)

---

## 📝 Quick Reference Cards

### Deploy + Verify (Production Workflow)

```
1. Deploy:  "Deploy this contract: [code]"
   Tool:    deploy-contract-source
   Time:    1-2 min (staging)

2. Verify: cd midl-example && npx hardhat verify --network regtest 0x[address]
   Tool:    Hardhat (not MCP)
   Time:    30 sec

Success:  100% verified
```

### Send Bitcoin

```
1. Estimate: "How much to send 0.1 BTC?"
   Tool:     estimate-btc-transfer-fee

2. Prepare:  "Send 0.1 BTC to bcrt1q..."
   Tool:     prepare-btc-transfer

3. Verify:   Auto-decoded by Claude
   Tool:     decode-psbt

4. Sign:     User approves
   Tool:     request-psbt-signature

5. Send:     Auto-broadcast
   Tool:     broadcast-transaction
```

### Check Status

```
Balance:      "What's my balance?"
              get-wallet-balance

Network:      "Network status?"
              get-blockchain-info

Transactions: "My recent transactions?"
              get-address-transactions
```

---

**Created:** 2026-02-05
**Documentation Files:** 6
**Total Coverage:** 14/14 tools (100%)
