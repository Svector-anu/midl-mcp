# MIDL Deploy Starter - Technical Reference

## Repository Structure

```
smart-contract-deploy-starter/
├── contracts/              # Solidity contracts
│   ├── Base.sol           # System contracts
│   ├── Proxies.sol        # Proxy patterns
│   ├── MessageBoard.sol   # Example application
│   └── Runes/            # Runes integration
├── deploy/                # Deployment scripts
│   ├── 000_deploy_Base.ts
│   ├── 000_deploy_Proxies.ts
│   ├── 002_deploy_message_board.ts
│   └── 000_deploy_Runes-Usage.ts
├── hardhat.config.ts      # Hardhat configuration
├── package.json           # Dependencies + viem override
└── .env.example          # Environment template
```

## Package.json Configuration

### Required Dependencies

```json
{
  "devDependencies": {
    "@midl/core": "3.0.0-next.29",
    "@midl/executor": "3.0.0-next.29",
    "@midl/hardhat-deploy": "3.0.0-next.29",
    "@nomicfoundation/hardhat-ethers": "^3.0.0",
    "@typechain/hardhat": "^9.1.0",
    "hardhat": "^2.25.0",
    "hardhat-deploy": "^1.0.4"
  },
  "dependencies": {
    "viem": "npm:@midl/viem@2.21.39"
  }
}
```

### CRITICAL: Viem Override

```json
{
  "pnpm": {
    "overrides": {
      "viem": "npm:@midl/viem@2.21.39"
    }
  }
}
```

This ensures ALL packages use @midl/viem, not standard viem.

## Hardhat Configuration Deep Dive

### Network Configuration

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@midl/hardhat-deploy";
import { MempoolSpaceProvider, MaestroSymphonyProvider } from "@midl/core";

const config: HardhatUserConfig = {
  networks: {
    regtest: {
      // Use staging RPC, not regtest RPC
      url: "https://rpc.staging.midl.xyz",

      // BIP86 (Taproot) path for Bitcoin addresses
      accounts: {
        mnemonic: process.env.MNEMONIC,
        path: "m/86'/1'/0'/0/0",
      },

      // Staging chain ID
      chainId: 15001,  // 0x3a99
    },
  },

  midl: {
    networks: {
      regtest: {
        mnemonic: process.env.MNEMONIC,

        // Wait for 1 confirmation (faster for staging)
        confirmationsRequired: 1,
        btcConfirmationsRequired: 1,

        hardhatNetwork: "regtest",

        network: {
          explorerUrl: "https://mempool.staging.midl.xyz",
          id: "regtest",
          network: "regtest",
        },

        // Bitcoin provider for staging
        providerFactory: () =>
          new MempoolSpaceProvider({
            regtest: "https://mempool.staging.midl.xyz",
          }),

        // Runes provider for staging
        runesProviderFactory: () =>
          new MaestroSymphonyProvider({
            regtest: "https://runes.staging.midl.xyz",
          }),
      },
    },
  },

  solidity: {
    compilers: [{
      version: "0.8.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "paris",  // Use paris for MIDL
      },
    }],
  },
};

export default config;
```

### Why These Settings?

| Setting | Value | Reason |
|---------|-------|--------|
| `url` | `rpc.staging.midl.xyz` | Has Executor system contracts |
| `chainId` | `15001` | Staging network chain ID |
| `path` | `m/86'/1'/0'/0/0` | BIP86 Taproot derivation |
| `confirmationsRequired` | `1` | Faster confirmation on staging |
| `evmVersion` | `paris` | Compatible with MIDL EVM |
| `optimizer.enabled` | `true` | Reduces deployment gas |

## Deployment Script Anatomy

### Basic Deployment Script

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // 1. Initialize MIDL with your mnemonic
  await hre.midl.initialize();

  // 2. Stage contract deployment
  await hre.midl.deploy('ContractName', [
    constructorArg1,
    constructorArg2,
  ]);

  // 3. Execute (submits BTC + EVM transactions)
  await hre.midl.execute();

  // 4. Get deployment info
  const deployment = await hre.midl.getDeployment('ContractName');

  console.log('Contract Address:', deployment.address);
  console.log('BTC TX ID:', deployment.btcTxId);
  console.log('Block Number:', deployment.receipt.blockNumber);
};

export default deploy;

// Tag for selective deployment
deploy.tags = ['ContractName'];

// Dependencies (run these tags first)
deploy.dependencies = ['OtherContract'];
```

### Advanced: Multiple Operations

```typescript
const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await hre.midl.initialize();

  // Deploy first contract
  await hre.midl.deploy('Token', ['MyToken', 'MTK', 1000000]);
  await hre.midl.execute();  // Wait 30s-2min

  // Get deployed address
  const token = await hre.midl.getDeployment('Token');

  // Deploy second contract using first's address
  await hre.midl.deploy('Exchange', [token.address]);
  await hre.midl.execute();  // Wait 30s-2min

  // Call function on first contract
  await hre.midl.write('Token', 'mint', [1000, hre.midl.evm.address]);
  await hre.midl.execute();  // Wait 8-15min for write ops
};
```

## System Contracts Explained

### Executor Contract

**Address:** `0x0000000000000000000000000000000000001006`

**Functions:**
- `btcFeeRate()` - Returns current BTC fee rate
- Used by all deployments and writes
- Pre-deployed on staging, missing on regtest

### Why It Matters

Every MIDL transaction needs to:
1. Calculate BTC fees via Executor contract
2. Create Bitcoin anchoring transaction
3. Sign EVM transaction with BIP322
4. Submit both together

Without Executor contract, step 1 fails immediately.

### Network Comparison

| Network | RPC URL | Has Executor? | Use For |
|---------|---------|---------------|---------|
| Staging | `rpc.staging.midl.xyz` | ✅ Yes | Deployment & testing |
| Regtest | `rpc.regtest.midl.xyz` | ❌ No | Not usable currently |

## Transaction Flow

### Deployment Transaction

```
1. User calls: hre.midl.deploy('Contract', [args])
   └─> Compiles contract
   └─> Generates deployment bytecode
   └─> Stages transaction in memory

2. User calls: hre.midl.execute()
   └─> Queries Executor.btcFeeRate()
   └─> Estimates gas for EVM transaction
   └─> Creates Bitcoin transaction (pays fees)
   └─> Signs EVM transaction with BIP322
   └─> Calls eth_sendBTCTransactions RPC
   └─> Waits for confirmation (~30s-2min)

3. Result: Contract deployed!
   └─> Contract address available
   └─> BTC TX ID available
   └─> Viewable on Blockscout + Mempool
```

### Write Transaction (Function Call)

```
1. User calls: hre.midl.write('Contract', 'function', [args])
   └─> Encodes function call
   └─> Stages transaction in memory

2. User calls: hre.midl.execute()
   └─> Queries Executor.btcFeeRate()
   └─> Estimates gas for EVM transaction
   └─> Creates Bitcoin transaction (pays fees)
   └─> Signs EVM transaction with BIP322
   └─> Calls eth_sendBTCTransactions RPC
   └─> Waits for confirmation (~8-15min!)

3. Result: Function executed!
   └─> Transaction hash available
   └─> State updated on-chain
```

**Why write ops take longer:**
- Bitcoin network propagation
- Staging network block times
- Transaction pool processing

## Gas Estimation

### The estimateGasMulti Problem

Standard `viem` has:
- `estimateGas()` - Estimates single transaction

MIDL needs:
- `estimateGasMulti()` - Estimates BTC + EVM transaction bundle

### Solution: @midl/viem Fork

```json
{
  "dependencies": {
    "viem": "npm:@midl/viem@2.21.39"
  },
  "pnpm": {
    "overrides": {
      "viem": "npm:@midl/viem@2.21.39"
    }
  }
}
```

This ensures:
- All packages use @midl/viem
- `estimateGasMulti` is available
- Gas estimation works correctly

### Verifying It Works

```bash
# Check what viem version is installed
pnpm list viem

# Should output:
# └── viem 2.21.39 -> @midl/viem@2.21.39

# If it shows standard viem, the override isn't working
```

## Timing Expectations

### Contract Deployment

```
Initialize:        ~1s
Compile:           ~5s
Deploy (stage):    ~0.1s
Execute:           ~30s - 2 minutes
Total:             ~35s - 2m15s
```

### Write Operations

```
Write (stage):     ~0.1s
Execute:           ~8 - 15 minutes (!!)
Total:             ~8 - 15 minutes
```

**Why so long for writes?**
- Bitcoin network propagation
- Staging block production time
- Transaction confirmation delays

**This is NORMAL - be patient!**

## Common Errors

### Error 1: btcFeeRate returned no data

```
Error: The contract function "btcFeeRate" returned no data ("0x")
This could be due to any of the following:
  - The contract does not have the function "btcFeeRate"
  - The contract call reverted
Contract Call:
  address:   0x0000000000000000000000000000000000001006
  function:  btcFeeRate()
```

**Root Cause:** Using regtest RPC

**Fix:** Change to staging RPC in hardhat.config.ts

### Error 2: Cannot estimate gas

```
Error: Cannot estimate gas; transaction may fail or may require manual gas limit
```

**Root Cause:** Missing viem override

**Fix:**
1. Add viem override to package.json
2. Delete node_modules and pnpm-lock.yaml
3. Run `pnpm install`

### Error 3: No selected UTXOs

```
Error: No selected UTXOs
```

**Root Cause:** Wallet has no BTC

**Fix:**
1. Check address: `npx hardhat midl:address 0 --network regtest`
2. Get test BTC from MIDL team
3. Verify: `curl https://mempool.staging.midl.xyz/api/address/YOUR_ADDRESS`

### Error 4: Deployment hangs forever

**If immediate hang:**
- Missing viem override
- Check `pnpm list viem`

**If hangs after 5+ minutes:**
- Normal on staging! Wait up to 15 minutes
- Check Blockscout to see if transaction appeared
- Don't kill the process

## Testing Deployed Contracts

### Using Hardhat Console

```bash
npx hardhat console --network regtest
```

```javascript
// Get contract
const deployment = await hre.deployments.get('MessageBoard');
const MessageBoard = await ethers.getContractAt('MessageBoard', deployment.address);

// Read data (instant)
const message = await MessageBoard.messages(0);
console.log(message);

// Write data (requires BTC, takes 8-15 min)
const tx = await MessageBoard.postMessage('Hello MIDL!');
await tx.wait();
```

### Using Cast (Foundry)

```bash
# Read function (instant)
cast call <CONTRACT_ADDRESS> "getCount()" --rpc-url https://rpc.staging.midl.xyz

# View on Blockscout
open "https://blockscout.staging.midl.xyz/address/<CONTRACT_ADDRESS>"
```

## Best Practices Checklist

Before deploying:
- [ ] Viem override in package.json
- [ ] Using staging RPC (not regtest)
- [ ] MNEMONIC in .env file
- [ ] Wallet has BTC balance
- [ ] Checked pnpm list viem shows @midl/viem

During deployment:
- [ ] One deployment at a time (don't run multiple)
- [ ] Monitor Blockscout for transaction
- [ ] Be patient with write operations (8-15 min normal)
- [ ] Save contract addresses when deployed

After deployment:
- [ ] Verify contract on Blockscout
- [ ] Test read functions first
- [ ] Document constructor args for re-verification
- [ ] Save BTC TX IDs for reference

## Links

- **Deploy Starter Repo:** https://github.com/midl-xyz/smart-contract-deploy-starter
- **MIDL JS Docs:** https://js.midl.xyz
- **MIDL Guides:** midl-js/apps/docs/midl/guides/
- **Staging Blockscout:** https://blockscout.staging.midl.xyz
- **Staging Mempool:** https://mempool.staging.midl.xyz
- **Advanced Examples:** midl-js/apps/docs/midl/tools/contracts/advanced-usage.md
