# MIDL MCP Server - Feature Testing Guide

Complete guide to testing all MCP server features.

---

## Quick Reference: All Available Tools

### 📝 Contract Operations
1. `deploy-contract-source` - Compile and deploy Solidity contracts
2. `call-contract` - Call functions on deployed contracts
3. `verify-contract` - Verify contract source code on Blockscout
4. `prepare-contract-deploy` - Manual contract deployment (advanced)

### 💰 Bitcoin Wallet Operations
5. `get-wallet-balance` - Check BTC balance
6. `prepare-btc-transfer` - Create unsigned PSBT for transfers
7. `broadcast-transaction` - Broadcast signed transactions
8. `estimate-btc-transfer-fee` - Estimate transaction costs

### 🔍 Blockchain Information
9. `get-address-transactions` - View transaction history
10. `get-blockchain-info` - Network status and info
11. `decode-psbt` - Inspect PSBT details
12. `validate-bitcoin-address` - Validate address format

---

## Test 1: Get Wallet Balance

**Ask Claude:**
```
What's my BTC balance?
```

**Expected Response:**
```
Balance for bcrt1q...: X.XXXXXXXX BTC (X,XXX,XXX satoshis)
```

**What it tests:** Connection to wallet, balance fetching

---

## Test 2: Validate Bitcoin Address

**Ask Claude:**
```
Is this a valid Bitcoin address: bcrt1q7dzudvh8jfvkeqgxjw88mf3dqws000jrvkmvdr
```

**Expected Response:**
```
✅ Valid Bitcoin address
Network: regtest
Address type: P2WPKH (Native SegWit)
```

**What it tests:** Address validation, network detection

---

## Test 3: Get Blockchain Info

**Ask Claude:**
```
What's the current blockchain status?
```

**Expected Response:**
```
Blockchain Information:
Network: regtest
Current Block Height: 7,275,XXX
Chain: regtest
Difficulty: X.XX
```

**What it tests:** Network connection, blockchain state

---

## Test 4: View Transaction History

**Ask Claude:**
```
Show me my recent transactions
```

**Expected Response:**
```
Transaction History for bcrt1q...:

Recent Transactions:
1. TxID: 442c92870e9b12e39e3afe9bb21aad0aea5807613144de69b517cc53a6d06d05
   Amount: -0.00000XXX BTC
   Confirmations: XX

2. TxID: ...
   ...
```

**What it tests:** Transaction history fetching, formatting

---

## Test 5: Estimate Transfer Fee

**Ask Claude:**
```
How much would it cost to send 0.001 BTC to bcrt1q7dzudvh8jfvkeqgxjw88mf3dqws000jrvkmvdr?
```

**Expected Response:**
```
Estimated Fee: XXX satoshis (0.0000XXXX BTC)
Fee Rate: XX sat/vB
Inputs: X
Outputs: X
```

**What it tests:** Fee estimation, UTXO selection

---

## Test 6: Prepare BTC Transfer (Don't Broadcast!)

**Ask Claude:**
```
Prepare a transfer of 10000 satoshis to bcrt1q7dzudvh8jfvkeqgxjw88mf3dqws000jrvkmvdr (don't broadcast)
```

**Expected Response:**
```
PSBT Prepared successfully.

PSBT (Base64):
cHNidP8BAF4CAAAA...

Transaction ID: ...

Please use 'decode-psbt' to verify details before signing.
```

**What it tests:** PSBT creation, transaction building

---

## Test 7: Decode PSBT

**Ask Claude:**
```
Decode this PSBT: [paste PSBT from Test 6]
```

**Expected Response:**
```
PSBT Details:

Inputs:
  - Address: bcrt1q...
    Amount: XXXX satoshis

Outputs:
  - Address: bcrt1q7dzudvh8jfvkeqgxjw88mf3dqws000jrvkmvdr
    Amount: 10000 satoshis
  - Address: bcrt1q... (change)
    Amount: XXXX satoshis

Fee: XXX satoshis
```

**What it tests:** PSBT parsing, transaction inspection

---

## Test 8: Deploy Contract (Already Tested)

**Ask Claude:**
```
Deploy this contract:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract SimpleStorage {
    uint256 public value;
    function setValue(uint256 _value) public { value = _value; }
}
```

**Expected Response:**
```
✅ Contract deployed successfully!
Contract Address: 0x...
BTC Transaction ID: ...
```

**What it tests:** Solidity compilation, contract deployment, BTC anchoring

---

## Test 9: Call Contract Function (Already Tested)

**Ask Claude:**
```
Call setValue(100) on contract 0x...
```

**Expected Response:**
```
✅ Contract call executed successfully!
BTC Transaction ID: ...
EVM Transaction Hash: 0x...
```

**What it tests:** Contract interaction, function encoding

---

## Test 10: Verify Contract

**Ask Claude:**
```
Verify contract 0x... with this source code:
[paste SimpleStorage code]
Contract name: SimpleStorage
```

**Expected Response:**
```
✅ Contract verified successfully!
Contract: 0x...
Compiler: v0.8.28+commit.7893614a

View verified contract: https://blockscout.regtest.midl.xyz/address/0x...
```

**What it tests:** Contract verification on Blockscout

---

## Test 11: Deploy Contract with OpenZeppelin

**Ask Claude:**
```
Deploy this ERC20 token:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10**18);
    }
}
```

**Expected Response:**
```
✅ Contract deployed successfully!
Contract Name: MyToken
Contract Address: 0x...
```

**What it tests:** Import resolution, OpenZeppelin support

---

## Test 12: Deploy Complex Contract

**Ask Claude:**
```
Deploy this Voting contract:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Proposal {
        string description;
        uint256 voteCount;
        mapping(address => bool) voters;
    }

    Proposal[] public proposals;

    function createProposal(string memory description) public {
        Proposal storage p = proposals.push();
        p.description = description;
    }

    function vote(uint256 proposalId) public {
        require(proposalId < proposals.length, "Invalid proposal");
        Proposal storage p = proposals[proposalId];
        require(!p.voters[msg.sender], "Already voted");

        p.voters[msg.sender] = true;
        p.voteCount++;
    }

    function getProposalCount() public view returns (uint256) {
        return proposals.length;
    }
}
```

**Expected Response:**
```
✅ Contract deployed successfully!
Contract Name: Voting
Contract Address: 0x...
```

**What it tests:** Complex types (structs, mappings), multiple functions

---

## Testing Checklist

Copy this checklist when testing:

```
[ ] Test 1: Get wallet balance
[ ] Test 2: Validate Bitcoin address
[ ] Test 3: Get blockchain info
[ ] Test 4: View transaction history
[ ] Test 5: Estimate transfer fee
[ ] Test 6: Prepare BTC transfer (no broadcast)
[ ] Test 7: Decode PSBT
[ ] Test 8: Deploy simple contract
[ ] Test 9: Call contract function
[ ] Test 10: Verify contract
[ ] Test 11: Deploy with OpenZeppelin
[ ] Test 12: Deploy complex contract
```

---

## Expected Results Summary

### All Tests Should:
- ✅ Return responses within 2-10 seconds
- ✅ Show clear success/error messages
- ✅ Provide transaction IDs and explorer links
- ✅ Handle errors gracefully

### Performance Benchmarks (Regtest):
- Balance check: <1 second
- Contract deployment: 2-5 seconds
- Contract interaction: 2-5 seconds
- Transaction history: 1-3 seconds
- PSBT operations: <1 second

---

## Common Issues and Solutions

### Issue: "No account connected"
**Solution:** Check `MIDL_MNEMONIC` in Claude Desktop config

### Issue: "Insufficient funds"
**Solution:** Get test BTC from https://faucet.midl.xyz

### Issue: "Network error"
**Solution:** Check if regtest network is running

### Issue: "Contract verification failed"
**Solution:** Ensure compiler version matches (v0.8.28)

---

## Next Steps

After completing all tests:
1. Document any failures or unexpected behavior
2. Test on mainnet/testnet (use real caution!)
3. Build more complex applications
4. Share your results

Happy testing! 🚀
