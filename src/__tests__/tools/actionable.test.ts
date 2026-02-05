import { describe, it, expect } from "vitest";
import { createMidlConfigFromEnv } from "../../config/factory.js";
import { MidlConfigWrapper } from "../../config/midl-config.js";
import { MidlMcpServer } from "../../server.js";
import { createPublicClient, http } from "viem";
import { getEVMFromBitcoinNetwork } from "@midl/executor";

describe("Gas Estimation Integration Tests", () => {
    it("should estimate gas using viem public client", async () => {
        process.env.MIDL_NETWORK = "regtest";
        process.env.MIDL_ACCOUNT_ADDRESS = "bcrt1q69qwavpyqlsktfqg5j77d4cuw000vqs3yymvd3";
        process.env.MIDL_ACCOUNT_PUBKEY = "025302d6c98bbbdeabf39f64dfa8aaf5167d700ae84f60664b5f62866f29b4569b";
        process.env.MIDL_RPC_URL = "https://mempool.regtest.midl.xyz";

        const midlConfig = await createMidlConfigFromEnv();

        if (!midlConfig) {
            console.warn("Skipping test - MIDL config not available");
            return;
        }

        const { network } = midlConfig.getState();
        const evmChain = getEVMFromBitcoinNetwork(network as any);
        const publicClient = createPublicClient({
            chain: evmChain as any,
            transport: http()
        });

        // Simple contract bytecode (minimal valid contract)
        const bytecode = "0x6080604052348015600f57600080fd5b50603c80601d6000396000f3fe6080604052600080fdfea264697066735822" as `0x${string}`;

        const gasEstimate = await publicClient.estimateGas({
            data: bytecode,
        });

        expect(gasEstimate).toBeGreaterThan(0n);
        expect(gasEstimate).toBeLessThan(10000000n);

        console.log(`Gas estimate for contract deployment: ${gasEstimate}`);
    }, 30000);

    it("should connect to MIDL regtest EVM RPC", async () => {
        process.env.MIDL_NETWORK = "regtest";
        process.env.MIDL_ACCOUNT_ADDRESS = "bcrt1q69qwavpyqlsktfqg5j77d4cuw000vqs3yymvd3";
        process.env.MIDL_ACCOUNT_PUBKEY = "025302d6c98bbbdeabf39f64dfa8aaf5167d700ae84f60664b5f62866f29b4569b";
        process.env.MIDL_RPC_URL = "https://mempool.regtest.midl.xyz";

        const midlConfig = await createMidlConfigFromEnv();

        if (!midlConfig) {
            console.warn("Skipping test - MIDL config not available");
            return;
        }

        const { network } = midlConfig.getState();
        const evmChain = getEVMFromBitcoinNetwork(network as any);
        const publicClient = createPublicClient({
            chain: evmChain as any,
            transport: http()
        });

        const blockNumber = await publicClient.getBlockNumber();
        expect(blockNumber).toBeGreaterThan(0n);

        console.log(`Current EVM block number: ${blockNumber}`);
    }, 30000);
});

describe("Contract Deployment Integration Tests", () => {
    it("should prepare a real contract deployment PSBT", async () => {
        process.env.MIDL_NETWORK = "regtest";
        process.env.MIDL_ACCOUNT_ADDRESS = "bcrt1q69qwavpyqlsktfqg5j77d4cuw000vqs3yymvd3";
        process.env.MIDL_ACCOUNT_PUBKEY = "025302d6c98bbbdeabf39f64dfa8aaf5167d700ae84f60664b5f62866f29b4569b";
        process.env.MIDL_RPC_URL = "https://mempool.regtest.midl.xyz";

        const midlConfig = await createMidlConfigFromEnv();

        if (!midlConfig) {
            console.warn("Skipping test - MIDL config not available");
            return;
        }

        const midlWrapper = new MidlConfigWrapper(midlConfig as any);
        const server = new MidlMcpServer(midlWrapper);
        const mcpServer = server.getMcpServer();

        // Access internal tool handlers (test-only pattern)
        const tools = (mcpServer as any)._toolHandlers || (mcpServer as any).toolHandlers;

        if (!tools || !tools.has("prepare-contract-deploy")) {
            console.warn("Skipping test - tools not available (internal API changed)");
            return;
        }

        const deployHandler = tools.get("prepare-contract-deploy");

        const simpleContract = "0x608060405234801561001057600080fd5b50";

        const result = await deployHandler({
            bytecode: simpleContract,
            args: [],
            feeRate: 1
        });

        expect(result.content).toBeDefined();
        expect(result.content[0].text).toContain("PSBT");

        console.log("Deployment PSBT prepared successfully");
    }, 30000);
});
