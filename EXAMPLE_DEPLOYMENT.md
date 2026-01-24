# Example: Deploying and Interacting with a Counter Contract

This is a complete example of deploying and interacting with a smart contract on MIDL L2 using Claude Desktop.

---

## Step 1: Deploy the Contract

**Prompt to Claude:**
```
Deploy this contract:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 private count;

    event Incremented(uint256 newCount);
    event Decremented(uint256 newCount);
    event Reset();

    function increment() public {
        count += 1;
        emit Incremented(count);
    }

    function decrement() public {
        require(count > 0, "Count is already 0");
        count -= 1;
        emit Decremented(count);
    }

    function reset() public {
        count = 0;
        emit Reset();
    }

    function getCount() public view returns (uint256) {
        return count;
    }

    function addAmount(uint256 amount) public {
        count += amount;
        emit Incremented(count);
    }
}
```

**Claude Response:**
```
✅ Contract deployed successfully!

Contract Name: Counter
Contract Address: 0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6
BTC Transaction ID: 442c92870e9b12e39e3afe9bb21aad0aea5807613144de69b517cc53a6d06d05
EVM Transaction Hash: 0x820c9a406d...cc92
Contract deployed at block: 7275561
✅ Contract verification submitted to Blockscout

View on Blockscout: https://blockscout.regtest.midl.xyz/address/0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6
View BTC tx: https://mempool.regtest.midl.xyz/tx/442c92870e9b12e39e3afe9bb21aad0aea5807613144de69b517cc53a6d06d05
```

---

## Step 2: Check Initial Count

**Prompt to Claude:**
```
Call getCount() on contract 0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6
```

**Claude Response:**
```
The current count is: 0
```

---

## Step 3: Increment the Counter

**Prompt to Claude:**
```
Call increment() on contract 0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6
```

**Claude Response:**
```
✅ Contract call executed successfully!

Contract: 0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6
Function: increment
BTC Transaction ID: df0be29def...2602
EVM Transaction Hash: 0xdf0be29def...2602
Confirmed at block: 7275572

View on Blockscout: https://blockscout.regtest.midl.xyz/tx/0xdf0be29def...2602
```

---

## Step 4: Add a Custom Amount

**Prompt to Claude:**
```
Call addAmount(42) on contract 0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6
```

**Claude Response:**
```
✅ Contract call executed successfully!

Contract: 0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6
Function: addAmount
BTC Transaction ID: 8b3c6748e7...c686
EVM Transaction Hash: 0x8b3c6748e7...c686
Confirmed at block: 7275582

View on Blockscout: https://blockscout.regtest.midl.xyz/tx/0x8b3c6748e7...c686
```

---

## Step 5: Verify Final Count

**Prompt to Claude:**
```
Call getCount() on contract 0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6
```

**Claude Response:**
```
The current count is: 43
```

**Calculation:** Initial (0) + increment (1) + addAmount (42) = **43** ✅

---

## Blockscout Explorer View

When you visit the contract on Blockscout, you can see all transactions:

### Contract Address: `0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6`

| Txn Hash | Type | Method | Block | Value | Result |
|----------|------|--------|-------|-------|--------|
| `0x8246b2...e643` | Contract call | `0xa87d942c` | 7275757 | 0 BTC | Success |
| `0xd2b648...1830` | Contract call | `0x06661abd` | 7275752 | 0 BTC | Success |
| `0x00a339...9b0b` | Contract call | `0x0912f232` | 7275606 | 0 BTC | Success |
| `0x8b3c67...c686` | Contract call | `addAmount` | 7275582 | 0 BTC | Success |
| `0xdf0be2...2602` | Contract call | `increment` | 7275572 | 0 BTC | Success |
| `0x820c9a...cc92` | **Contract creation** | - | 7275561 | 0 BTC | Success |

### Transaction Details

**Contract Creation** (Block 7275561)
- Creator: `0xF8483dddbCB103519F8BfE1713aBDa4f3A9C20b0`
- Gas Used: 197,479
- Status: ✅ Success

**increment() Call** (Block 7275572)
- From: `0xF8483dddbCB103519F8BfE1713aBDa4f3A9C20b0`
- To: `0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6`
- Status: ✅ Success
- Event: `Incremented(1)`

**addAmount(42) Call** (Block 7275582)
- From: `0xF8483dddbCB103519F8BfE1713aBDa4f3A9C20b0`
- To: `0xE8958c4d68539ABb86B28481a3C7ac7f5A02C2E6`
- Status: ✅ Success
- Event: `Incremented(43)`

---

## Key Insights

### 1. Deployment Process
- Single command deploys the entire contract
- Bitcoin transaction anchors the deployment on-chain
- EVM transaction contains the contract bytecode
- Both transactions are submitted together via `eth_sendBTCTransactions`

### 2. Interacting with Contracts
- Read functions (like `getCount()`) are free and instant
- Write functions (like `increment()`, `addAmount()`) require Bitcoin transactions
- Each write operation creates both a BTC tx and an EVM tx

### 3. Transaction Costs
- All transactions in this example: **0 BTC transaction fees**
- Gas price: **0.000001 Gwei** (effectively free on regtest)

### 4. Confirmation Times
- Bitcoin confirmation: ~2 seconds on regtest
- Contract deployment to interaction: ~11 seconds (6 blocks)
- Each write operation: ~2-10 seconds

---

## Summary

This example demonstrates:
- ✅ Deploying a multi-function smart contract
- ✅ Reading contract state (free operations)
- ✅ Writing to contract state (BTC-anchored transactions)
- ✅ Event emission and tracking
- ✅ Complete transaction history on Blockscout

**Total operations:** 1 deployment + 5 interactions
**Total time:** ~8 minutes
**Total cost:** Effectively free on regtest
**Success rate:** 100%

---

## Try It Yourself

1. Set up Claude Desktop with your MIDL mnemonic
2. Copy the Counter contract code
3. Ask Claude: "Deploy this contract: [paste code]"
4. Interact using natural language: "Call increment() on contract 0x..."
5. View results on Blockscout

That's it! You're now deploying and interacting with Bitcoin-anchored smart contracts.
