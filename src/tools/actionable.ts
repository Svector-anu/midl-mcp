import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { transferBTC, broadcastTransaction, signPSBT, getDefaultAccount, SignMessageProtocol } from "@midl/core";
import { addTxIntention, finalizeBTCTransaction, getEVMFromBitcoinNetwork, getEVMAddress, signIntention } from "@midl/executor";
import { createPublicClient, createWalletClient, http, encodeDeployData, getContractAddress, encodeFunctionData, keccak256 } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import solc from "solc";
import { MidlConfigWrapper } from "../config/midl-config.js";

// Helper to call eth_sendBTCTransactions RPC method
async function sendBTCTransactions(
    client: any,
    params: { serializedTransactions: `0x${string}`[]; btcTransaction: string }
): Promise<`0x${string}`[]> {
    return client.request(
        {
            method: "eth_sendBTCTransactions",
            params: [params.serializedTransactions, params.btcTransaction],
        },
        { retryCount: 0 }
    );
}

/**
 * Registers actionable tools on the McpServer.
 */
export function registerActionableTools(server: McpServer, midl: MidlConfigWrapper) {
    const config = midl.getConfig();

    // Tool: prepare-btc-transfer
    server.tool(
        "prepare-btc-transfer",
        "Prepare an unsigned PSBT for a Bitcoin transfer (No signature or broadcast)",
        {
            recipients: z.array(z.object({
                address: z.string().describe("Recipient Bitcoin address"),
                amount: z.number().int().positive().describe("Amount in satoshis"),
            })),
            feeRate: z.number().int().optional().describe("Fee rate in sat/vB."),
            from: z.string().optional().describe("Source address to spend from."),
        },
        async ({ recipients, feeRate, from }) => {
            try {
                const transfers = recipients.map(r => ({ receiver: r.address, amount: r.amount }));
                const response = await transferBTC(config, {
                    transfers,
                    feeRate: feeRate ?? undefined,
                    from: from ?? undefined,
                    publish: false
                } as any); // Cast to any to bypass strict feeRate nullability for now if needed, or fix the type in core

                return {
                    content: [
                        {
                            type: "text",
                            text: `PSBT Prepared successfully.\n\nPSBT (Base64):\n${response.psbt}\n\nTransaction ID: ${response.tx.id}\n\nPlease use 'decode-psbt' to verify details before signing.`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error preparing transfer: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: request-psbt-signature
    server.tool(
        "request-psbt-signature",
        "Request a human signature for a PSBT via elicitation",
        {
            psbt: z.string().describe("Base64 encoded PSBT to sign"),
            address: z.string().optional().describe("Address to sign for. If omitted, uses default account."),
        },
        async ({ psbt, address }, extra: any) => {
            try {
                if (extra?.sendRequest) {
                    const confirmed: any = await extra.sendRequest({
                        method: "elicitation/create",
                        params: {
                            mode: "form",
                            message: "Please confirm that you want to SIGN this Bitcoin transaction.",
                            requestedSchema: {
                                type: "object",
                                properties: {
                                    approved: { type: "boolean", description: "I approve this signature request" }
                                },
                                required: ["approved"]
                            }
                        }
                    });

                    if (!confirmed || !confirmed.approved) {
                        return {
                            content: [{ type: "text", text: "Signature request declined by user." }],
                            isError: true
                        };
                    }
                } else {
                    return {
                        content: [{ type: "text", text: "Error: Human elicitation required for signing but not supported by client." }],
                        isError: true
                    };
                }

                const state = config.getState();
                const account = address
                    ? state.accounts?.find(a => a.address === address)
                    : getDefaultAccount(config);

                if (!account) {
                    throw new Error("No account found for signing.");
                }

                const signedRes = await signPSBT(config, {
                    psbt,
                    signInputs: {
                        [account.address]: [0]
                    },
                    publish: false
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `PSBT signed successfully.\n\nSigned PSBT (Base64):\n${signedRes}`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error signing PSBT: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: request-transaction-broadcast
    server.tool(
        "request-transaction-broadcast",
        "Request human confirmation to broadcast a signed transaction",
        {
            txHex: z.string().describe("Signed raw transaction hex string"),
        },
        async ({ txHex }, extra: any) => {
            try {
                if (extra?.sendRequest) {
                    const confirmed: any = await extra.sendRequest({
                        method: "elicitation/create",
                        params: {
                            mode: "form",
                            message: "CRITICAL: You are about to BROADCAST a transaction to the Bitcoin Network. This action is irreversible.",
                            requestedSchema: {
                                type: "object",
                                properties: {
                                    confirm: { type: "boolean", description: "I understand and wish to broadcast this transaction" }
                                },
                                required: ["confirm"]
                            }
                        }
                    });

                    if (!confirmed || !confirmed.confirm) {
                        return {
                            content: [{ type: "text", text: "Broadcast cancelled by user." }],
                            isError: true
                        };
                    }
                } else {
                    return {
                        content: [{ type: "text", text: "Error: Human elicitation required for broadcasting but not supported by client." }],
                        isError: true
                    };
                }

                const txId = await broadcastTransaction(config, txHex);
                const explorerUrl = config.getState().network.explorerUrl;

                return {
                    content: [
                        {
                            type: "text",
                            text: `Transaction broadcasted successfully!\n\nTransaction ID: ${txId}\nView on Explorer: ${explorerUrl}${txId}`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error broadcasting transaction: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: broadcast-transaction (for standalone BTC transactions)
    server.tool(
        "broadcast-transaction",
        "Broadcast a signed Bitcoin transaction to the network. Use this for BTC transfers. For contract deployments and calls, use deploy-contract-source or call-contract which handle the complete MIDL flow automatically.",
        {
            txHex: z.string().describe("The signed raw transaction hex string"),
        },
        async ({ txHex }) => {
            try {
                const txId = await broadcastTransaction(config, txHex);
                const explorerUrl = config.getState().network?.explorerUrl || "";

                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Transaction broadcasted successfully!\n\nTransaction ID: ${txId}\nExplorer: ${explorerUrl}${txId}`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error broadcasting: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: prepare-contract-deploy
    server.tool(
        "prepare-contract-deploy",
        "Prepare a Bitcoin PSBT to anchor an EVM contract deployment on MIDL-L2",
        {
            bytecode: z.string().describe("The compiled Solidity contract bytecode (hex)"),
            args: z.array(z.any()).optional().describe("Constructor arguments"),
            abi: z.array(z.any()).optional().describe("Contract ABI (required if args are provided)"),
            feeRate: z.number().int().optional().describe("Bitcoin fee rate in sat/vB."),
        },
        async ({ bytecode, args, abi, feeRate }) => {
            try {
                const { network } = config.getState();
                const evmChain = getEVMFromBitcoinNetwork(network as any);
                const publicClient = createPublicClient({
                    chain: evmChain as any,
                    transport: http()
                });

                let data = bytecode as `0x${string}`;
                if (!data.startsWith("0x")) data = `0x${data}` as any;

                if (args && args.length > 0) {
                    if (!abi) throw new Error("ABI is required when constructor arguments are provided.");
                    data = encodeDeployData({
                        abi,
                        args,
                        bytecode: data
                    });
                }

                const intention = await addTxIntention(config, {
                    evmTransaction: {
                        type: "btc",
                        data,
                    }
                } as any);

                const btcTx = await finalizeBTCTransaction(config, [intention], publicClient as any, {
                    ...(feeRate ? { feeRate } : {})
                });

                const evmAddress = getEVMAddress(getDefaultAccount(config) as any, network as any);
                const nonce = await publicClient.getTransactionCount({ address: evmAddress as `0x${string}` });
                const predictedAddress = getContractAddress({
                    from: evmAddress as `0x${string}`,
                    nonce: BigInt(nonce)
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Contract deployment PSBT prepared successfully.\n\nPredicted Contract Address: ${predictedAddress}\nDeployer EVM Address: ${evmAddress}\n\nPSBT (Base64):\n${btcTx.psbt}\n\nThis transaction anchors a contract deployment on the MIDL EVM chain (${network.id}).\nPlease use 'request-psbt-signature' and then 'request-transaction-broadcast' to complete the deployment.`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error preparing contract deployment: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: call-contract
    server.tool(
        "call-contract",
        "Call a function on a deployed smart contract on MIDL-L2. Creates a Bitcoin transaction that anchors the EVM call.",
        {
            contractAddress: z.string().describe("The EVM contract address (0x...)"),
            abi: z.array(z.any()).describe("The contract ABI"),
            functionName: z.string().describe("The function name to call"),
            args: z.array(z.any()).optional().describe("Function arguments"),
            value: z.number().int().optional().describe("Optional BTC value to send (satoshis)"),
            feeRate: z.number().int().optional().describe("Bitcoin fee rate in sat/vB."),
        },
        async ({ contractAddress, abi, functionName, args, value, feeRate }) => {
            try {
                const { network } = config.getState();
                const evmChain = getEVMFromBitcoinNetwork(network as any);

                const data = encodeFunctionData({
                    abi,
                    functionName,
                    args: args ?? []
                });

                const intention = await addTxIntention(config, {
                    evmTransaction: {
                        type: "btc",
                        to: contractAddress as `0x${string}`,
                        data,
                        value: value ? BigInt(value) : undefined,
                        chainId: evmChain.id,
                    }
                } as any);

                // Create a wallet client for signing and sending
                const walletClient = createWalletClient({
                    chain: evmChain as any,
                    transport: http()
                });

                // 1. Finalize the BTC transaction
                const btcTx = await finalizeBTCTransaction(config, [intention], walletClient as any, {
                    ...(feeRate ? { feeRate } : {})
                });

                const btcTxId = btcTx.tx?.id || "";
                const btcTxHex = btcTx.tx?.hex || "";

                // 2. Sign the EVM intention with the BTC txId
                const signedEvmTx = await signIntention(
                    config,
                    walletClient as any,
                    intention,
                    [intention],
                    {
                        txId: btcTxId,
                        protocol: SignMessageProtocol.Bip322,
                    }
                );

                const evmTxHash = keccak256(signedEvmTx);

                // 3. Send both transactions to the MIDL network
                await sendBTCTransactions(walletClient as any, {
                    serializedTransactions: [signedEvmTx],
                    btcTransaction: btcTxHex,
                });

                // 4. Wait for confirmation
                let receiptInfo = "";
                try {
                    const receipt = await waitForTransactionReceipt(walletClient as any, {
                        hash: evmTxHash,
                        timeout: 60_000,
                    });
                    receiptInfo = `\nConfirmed at block: ${receipt.blockNumber}`;
                } catch (e) {
                    receiptInfo = `\nNote: Transaction submitted, waiting for confirmation...`;
                }

                const blockscoutUrl = network.id === "regtest"
                    ? `https://blockscout.regtest.midl.xyz/tx/${evmTxHash}`
                    : `https://blockscout.midl.xyz/tx/${evmTxHash}`;

                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Contract call executed successfully!\n\nContract: ${contractAddress}\nFunction: ${functionName}\nBTC Transaction ID: ${btcTxId}\nEVM Transaction Hash: ${evmTxHash}${receiptInfo}\n\nView on Blockscout: ${blockscoutUrl}`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error calling contract: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: deploy-contract-source
    server.tool(
        "deploy-contract-source",
        "Compile Solidity source code and prepare a Bitcoin PSBT for deployment. AUTOMATICALLY resolves @openzeppelin/contracts imports from GitHub. No local node_modules required.",
        {
            sourceCode: z.string().describe("The Solidity source code"),
            contractName: z.string().optional().describe("The name of the contract to deploy. If omitted, the last contract defined in the code is used."),
            args: z.array(z.any()).optional().describe("Constructor arguments"),
            feeRate: z.number().int().optional().describe("Bitcoin fee rate in sat/vB."),
        },
        async ({ sourceCode, contractName, args, feeRate }) => {
            try {
                // 1. Resolve Imports (Simple version, mainly for OpenZeppelin)
                const sources: Record<string, { content: string }> = {
                    "Contract.sol": { content: sourceCode }
                };

                const resolveImports = async (content: string) => {
                    const importRegex = /import\s+["']([^"']+)["']/g;
                    let match;
                    while ((match = importRegex.exec(content)) !== null) {
                        const importPath = match[1];
                        if (importPath && !sources[importPath]) {
                            let url = "";
                            if (importPath.startsWith("@openzeppelin/")) {
                                url = `https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/${importPath.replace("@openzeppelin/", "")}`;
                            } else {
                                // Fallback or handle relative imports here if needed
                                continue;
                            }

                            const res = await fetch(url);
                            if (res.ok) {
                                const importedSource = await res.text();
                                sources[importPath] = { content: importedSource };
                                await resolveImports(importedSource);
                            }
                        }
                    }
                };

                await resolveImports(sourceCode);

                // 2. Compile with explicit settings for reproducibility
                const input = {
                    language: 'Solidity',
                    sources,
                    settings: {
                        optimizer: {
                            enabled: false,
                            runs: 200
                        },
                        evmVersion: "cancun",  // Use latest stable EVM version
                        outputSelection: {
                            '*': {
                                '*': ['abi', 'evm.bytecode', 'metadata']
                            }
                        }
                    }
                };

                const output = JSON.parse(solc.compile(JSON.stringify(input)));

                if (output.errors) {
                    const errors = output.errors.filter((e: any) => e.severity === 'error');
                    if (errors.length > 0) {
                        return {
                            content: [{ type: "text", text: `Compilation Error: ${errors[0].formattedMessage}` }],
                            isError: true
                        };
                    }
                }

                // Find the specific contract in the output
                let contractArtifact: any = null;
                let targetName = contractName;

                if (!targetName) {
                    // Default to the last contract defined in the sources (heuristic for main contract)
                    const fileContracts = Object.values(output.contracts)[0];
                    if (fileContracts) {
                        const names = Object.keys(fileContracts);
                        targetName = names[names.length - 1];
                    }
                }

                for (const fileName in output.contracts) {
                    if (output.contracts[fileName][targetName!]) {
                        contractArtifact = output.contracts[fileName][targetName!];
                        break;
                    }
                }

                if (!contractArtifact) {
                    const allContracts = Object.values(output.contracts).flatMap(f => Object.keys(f as any));
                    return {
                        content: [{ type: "text", text: `Contract "${targetName || contractName}" not found. Available: ${allContracts.join(", ")}` }],
                        isError: true
                    };
                }

                const bytecode = contractArtifact.evm.bytecode.object;
                const abi = contractArtifact.abi;

                // 3. Prepare PSBT (Reuse logic from prepare-contract-deploy)
                const { network } = config.getState();
                const evmChain = getEVMFromBitcoinNetwork(network as any);
                const publicClient = createPublicClient({
                    chain: evmChain as any,
                    transport: http()
                });

                let data = bytecode as `0x${string}`;
                if (!data.startsWith("0x")) data = `0x${data}` as any;

                data = encodeDeployData({
                    abi,
                    args: args ?? [],
                    bytecode: data
                });

                const evmAddress = getEVMAddress(getDefaultAccount(config) as any, network as any);
                const nonce = await publicClient.getTransactionCount({ address: evmAddress as `0x${string}` });
                const predictedAddress = getContractAddress({
                    from: evmAddress as `0x${string}`,
                    nonce: BigInt(nonce)
                });

                const intention = await addTxIntention(config, {
                    evmTransaction: {
                        type: "btc",
                        data,
                        chainId: evmChain.id,
                    },
                    meta: {
                        contractName: targetName,
                    }
                } as any);

                // Create a wallet client for signing EVM transactions
                const walletClient = createWalletClient({
                    chain: evmChain as any,
                    transport: http()
                });

                // 1. Finalize the BTC transaction (signs the PSBT)
                const btcTx = await finalizeBTCTransaction(config, [intention], walletClient as any, {
                    ...(feeRate ? { feeRate } : {})
                });

                const btcTxId = btcTx.tx?.id || "";
                const btcTxHex = btcTx.tx?.hex || "";

                // 2. Sign the EVM intention with the BTC txId (BIP322)
                const signedEvmTx = await signIntention(
                    config,
                    walletClient as any,
                    intention,
                    [intention],
                    {
                        txId: btcTxId,
                        protocol: SignMessageProtocol.Bip322,
                    }
                );

                const evmTxHash = keccak256(signedEvmTx);

                // 3. Send both BTC tx and signed EVM tx to the MIDL network
                await sendBTCTransactions(walletClient as any, {
                    serializedTransactions: [signedEvmTx],
                    btcTransaction: btcTxHex,
                });

                // 4. Wait for EVM transaction receipt (optional, with timeout)
                let receiptInfo = "";
                try {
                    const receipt = await waitForTransactionReceipt(walletClient as any, {
                        hash: evmTxHash,
                        timeout: 60_000, // 60 second timeout
                    });
                    receiptInfo = `\nContract deployed at block: ${receipt.blockNumber}`;
                } catch (e) {
                    receiptInfo = `\nNote: Transaction submitted, waiting for confirmation...`;
                }

                const blockscoutBaseUrl = network.id === "regtest"
                    ? "https://blockscout.regtest.midl.xyz"
                    : "https://blockscout.midl.xyz";
                const blockscoutUrl = `${blockscoutBaseUrl}/address/${predictedAddress}`;

                // 5. Auto-verify contract on Blockscout
                let verificationInfo = "";
                try {
                    // Flatten source code for verification (combine all sources)
                    let flattenedSource = sourceCode;
                    for (const [path, source] of Object.entries(sources)) {
                        if (path !== "Contract.sol") {
                            flattenedSource = `// File: ${path}\n${source.content}\n\n${flattenedSource}`;
                        }
                    }

                    const compilerVersion = `v${solc.version().replace(".Emscripten.clang", "")}`;

                    const verifyResponse = await fetch(
                        `${blockscoutBaseUrl}/api/v2/smart-contracts/${predictedAddress}/verification/via/flattened-code`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                compiler_version: compilerVersion,
                                source_code: flattenedSource,
                                is_optimization_enabled: false,
                                optimization_runs: 200,
                                contract_name: targetName,
                                evm_version: "cancun",
                                autodetect_constructor_args: true,
                                license_type: "mit"
                            })
                        }
                    );

                    if (verifyResponse.ok) {
                        verificationInfo = "\n✅ Contract verification submitted to Blockscout";
                    } else {
                        const errorText = await verifyResponse.text();
                        verificationInfo = `\n⚠️ Verification failed: ${errorText.slice(0, 100)}`;
                    }
                } catch (e: any) {
                    verificationInfo = `\n⚠️ Auto-verification skipped: ${e.message}`;
                }

                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Contract deployed successfully!\n\nContract Name: ${targetName}\nContract Address: ${predictedAddress}\nBTC Transaction ID: ${btcTxId}\nEVM Transaction Hash: ${evmTxHash}${receiptInfo}${verificationInfo}\n\nView on Blockscout: ${blockscoutUrl}\nView BTC tx: ${network.explorerUrl || ""}${btcTxId}`,
                        },
                    ],
                };

            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error in deploy-contract-source: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: verify-contract
    server.tool(
        "verify-contract",
        "Verify a deployed smart contract on Blockscout. Submit the source code to enable contract interaction via the explorer.",
        {
            contractAddress: z.string().describe("The deployed contract address (0x...)"),
            sourceCode: z.string().describe("The Solidity source code"),
            contractName: z.string().describe("The contract name as it appears in the source"),
            compilerVersion: z.string().optional().describe("Compiler version (e.g., 'v0.8.28+commit.7893614a'). If omitted, uses solc bundled version."),
            optimizationEnabled: z.boolean().optional().describe("Whether optimization was enabled during compilation"),
            optimizationRuns: z.number().int().optional().describe("Number of optimization runs (default: 200)"),
            constructorArgs: z.string().optional().describe("ABI-encoded constructor arguments (hex string without 0x prefix)"),
            licenseType: z.string().optional().describe("License type: none, unlicense, mit, gnu_gpl_v2, gnu_gpl_v3, apache_2_0, etc."),
        },
        async ({ contractAddress, sourceCode, contractName, compilerVersion, optimizationEnabled, optimizationRuns, constructorArgs, licenseType }) => {
            try {
                const { network } = config.getState();
                const blockscoutBaseUrl = network.id === "regtest"
                    ? "https://blockscout.regtest.midl.xyz"
                    : "https://blockscout.midl.xyz";

                // Resolve imports for flattening
                const sources: Record<string, { content: string }> = {
                    "Contract.sol": { content: sourceCode }
                };

                const resolveImports = async (content: string) => {
                    const importRegex = /import\s+["']([^"']+)["']/g;
                    let match;
                    while ((match = importRegex.exec(content)) !== null) {
                        const importPath = match[1];
                        if (importPath && !sources[importPath]) {
                            let url = "";
                            if (importPath.startsWith("@openzeppelin/")) {
                                url = `https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/${importPath.replace("@openzeppelin/", "")}`;
                            } else {
                                continue;
                            }

                            const res = await fetch(url);
                            if (res.ok) {
                                const importedSource = await res.text();
                                sources[importPath] = { content: importedSource };
                                await resolveImports(importedSource);
                            }
                        }
                    }
                };

                await resolveImports(sourceCode);

                // Flatten source code
                let flattenedSource = sourceCode;
                for (const [path, source] of Object.entries(sources)) {
                    if (path !== "Contract.sol") {
                        flattenedSource = `// File: ${path}\n${source.content}\n\n${flattenedSource}`;
                    }
                }

                const version = compilerVersion || `v${solc.version().replace(".Emscripten.clang", "")}`;

                const verifyBody: Record<string, any> = {
                    compiler_version: version,
                    source_code: flattenedSource,
                    is_optimization_enabled: optimizationEnabled ?? false,
                    optimization_runs: optimizationRuns ?? 200,
                    contract_name: contractName,
                    license_type: licenseType || "mit",
                };

                if (constructorArgs) {
                    verifyBody.constructor_args = constructorArgs;
                    verifyBody.autodetect_constructor_args = false;
                } else {
                    verifyBody.autodetect_constructor_args = true;
                }

                const response = await fetch(
                    `${blockscoutBaseUrl}/api/v2/smart-contracts/${contractAddress}/verification/via/flattened-code`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(verifyBody)
                    }
                );

                if (response.ok) {
                    const result = await response.json();
                    return {
                        content: [
                            {
                                type: "text",
                                text: `✅ Contract verified successfully!\n\nContract: ${contractAddress}\nName: ${contractName}\nCompiler: ${version}\n\nView verified contract: ${blockscoutBaseUrl}/address/${contractAddress}?tab=contract`,
                            },
                        ],
                    };
                } else {
                    const errorText = await response.text();
                    return {
                        content: [{ type: "text", text: `Verification failed: ${errorText}` }],
                        isError: true,
                    };
                }
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error verifying contract: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}
