import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { transferBTC, broadcastTransaction, signPSBT, getDefaultAccount } from "@midl/core";
import { addTxIntention, finalizeBTCTransaction, getEVMFromBitcoinNetwork, getEVMAddress } from "@midl/executor";
import { createPublicClient, http, encodeDeployData, getContractAddress, encodeFunctionData } from "viem";
import { MidlConfigWrapper } from "../config/midl-config.js";

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

    // Tool: prepare-contract-call
    server.tool(
        "prepare-contract-call",
        "Prepare a Bitcoin PSBT to anchor a contract function call on MIDL-L2",
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
                const publicClient = createPublicClient({
                    chain: evmChain as any,
                    transport: http()
                });

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
                        value: value ? BigInt(value) : undefined
                    }
                } as any);

                const btcTx = await finalizeBTCTransaction(config, [intention], publicClient as any, {
                    ...(feeRate ? { feeRate } : {})
                });

                return {
                    content: [
                        {
                            type: "text",
                            text: `Contract call PSBT prepared successfully.\n\nContract: ${contractAddress}\nFunction: ${functionName}\n\nPSBT (Base64):\n${btcTx.psbt}\n\nThis transaction anchors a contract call on the MIDL EVM chain (${network.id}).\nPlease use 'request-psbt-signature' and then 'request-transaction-broadcast' to complete the call.`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error preparing contract call: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}
