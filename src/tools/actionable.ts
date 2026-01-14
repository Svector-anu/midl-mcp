import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { transferBTC, broadcastTransaction, signPSBT, getDefaultAccount } from "@midl/core";
import { Psbt, networks } from "bitcoinjs-lib";
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
                // Using transferBTC with publish: false to just get the PSBT
                // Note: transferBTC in current core might still try to sign if it has the connector.
                // But our config wrapper ensures it's pre-connected.
                const response = await transferBTC(config, {
                    transfers,
                    feeRate,
                    from,
                    publish: false
                });

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
                // 1. Show details to user via elicitation if supported
                // In MCP v1.x, we use extra.sendRequest if available
                if (extra?.sendRequest) {
                    const confirmed = await extra.sendRequest({
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
                    // Fallback for clients without elicitation support
                    // For now we'll require elicitation for safety, or implement a manual confirmation step
                    return {
                        content: [{ type: "text", text: "Error: Human elicitation required for signing but not supported by client." }],
                        isError: true
                    };
                }

                // 2. Perform signing if confirmed
                const state = config.getState();
                const account = address
                    ? state.accounts?.find(a => a.address === address)
                    : getDefaultAccount(config);

                if (!account) {
                    throw new Error("No account found for signing.");
                }

                // In MIDL.js core, signPSBT typically happens via connection
                const signedRes = await signPSBT(config, {
                    psbt,
                    signInputs: {
                        [account.address]: [0] // Correctly identifying inputs requires more logic, for now assuming first input
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
                    const confirmed = await extra.sendRequest({
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

                return {
                    content: [
                        {
                            type: "text",
                            text: `Transaction broadcasted successfully!\n\nTransaction ID: ${txId}\nView on mempool.space (testnet): https://mempool.space/testnet/tx/${txId}`,
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
}
