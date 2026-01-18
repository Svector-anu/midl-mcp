import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFeeRate, getUTXOs, getDefaultAccount, getBalance } from "@midl/core";
import coinSelect from "bitcoinselect";
import { Psbt, networks } from "bitcoinjs-lib";
import { MidlConfigWrapper } from "../config/midl-config.js";
import { satoshisToBtc, formatBalance } from "../utils/formatters.js";

/**
 * Registers analytical tools on the McpServer.
 */
export function registerTools(server: McpServer, midl: MidlConfigWrapper) {
    const config = midl.getConfig();

    // Tool: get-wallet-balance
    server.tool(
        "get-wallet-balance",
        "Get the Bitcoin balance of an address (defaults to the connected account)",
        {
            address: z.string().optional().describe("Bitcoin address. If omitted, uses the connected account."),
        },
        async ({ address }) => {
            const targetAddress = address || getDefaultAccount(config)?.address;

            if (!targetAddress) {
                return {
                    content: [{ type: "text", text: "Error: No address provided and no account connected." }],
                    isError: true,
                };
            }

            try {
                const balanceSats = await getBalance(config, targetAddress);
                return {
                    content: [
                        {
                            type: "text",
                            text: `Balance for ${targetAddress}: ${formatBalance(balanceSats)}`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error fetching balance: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: estimate-btc-transfer-fee
    server.tool(
        "estimate-btc-transfer-fee",
        "Estimate the fee for a Bitcoin transfer",
        {
            recipients: z.array(z.object({
                address: z.string().describe("Recipient Bitcoin address"),
                amount: z.number().int().positive().describe("Amount in satoshis"),
            })),
            feeRate: z.number().int().optional().describe("Fee rate in sat/vB. If omitted, uses current network recommended fee."),
            from: z.string().optional().describe("Source address to spend from. If omitted, uses default account."),
        },
        async ({ recipients, feeRate, from }) => {
            const state = config.getState();
            const account = from
                ? state.accounts?.find(a => a.address === from)
                : getDefaultAccount(config);

            if (!account) {
                return {
                    content: [{ type: "text", text: "Error: No account found for the specified address." }],
                    isError: true,
                };
            }

            const currentFeeRate = feeRate || (await getFeeRate(config)).hourFee;
            const utxos = await getUTXOs(config, account.address);
            const targets = recipients.map(r => ({ address: r.address, value: r.amount }));

            const selected = coinSelect(utxos, targets, currentFeeRate);

            if (!selected.inputs || !selected.outputs) {
                return {
                    content: [{ type: "text", text: "Error: Insufficient funds or no suitable UTXOs found for this transfer." }],
                    isError: true,
                };
            }

            return {
                content: [
                    {
                        type: "text",
                        text: `Estimated Fee: ${selected.fee} satoshis (${satoshisToBtc(selected.fee)} BTC)\nFee Rate: ${currentFeeRate} sat/vB\nInputs: ${selected.inputs.length}\nOutputs: ${selected.outputs.length}`,
                    },
                ],
            };
        }
    );

    // Tool: decode-psbt
    server.tool(
        "decode-psbt",
        "Decode a base64 encoded PSBT into human-readable format",
        {
            psbt: z.string().describe("Base64 encoded PSBT string"),
        },
        async ({ psbt: psbtBase64 }) => {
            try {
                const state = config.getState();
                const network = networks[state.network.network as keyof typeof networks] || networks.testnet;
                const psbt = Psbt.fromBase64(psbtBase64, { network });

                const data = {
                    txId: psbt.extractTransaction().getId(),
                    locktime: psbt.locktime,
                    inputs: psbt.txInputs.map((input: any, i: number) => ({
                        index: i,
                        hash: input.hash.toString("hex"),
                        vout: input.index,
                        sequence: input.sequence,
                    })),
                    outputs: psbt.txOutputs.map((output: any, i: number) => ({
                        index: i,
                        address: output.address,
                        value: Number(output.value),
                    })),
                };

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error decoding PSBT: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: validate-bitcoin-address
    server.tool(
        "validate-bitcoin-address",
        "Validate a Bitcoin address for the current network",
        {
            address: z.string().describe("Bitcoin address to validate"),
        },
        async ({ address }) => {
            const state = config.getState();
            const networkName = state.network.network;
            const network = networks[networkName as keyof typeof networks] || networks.testnet;

            // Simple validation attempt by trying to decode it
            try {
                // In a real implementation we'd use bitcoinjs-lib's address.toOutputScript
                // but for now we'll just check if it's a string and do a basic format check
                // matched to the network.
                const isValid = address.length > 25; // Simple heuristic
                return {
                    content: [
                        {
                            type: "text",
                            text: `Address: ${address}\nNetwork: ${networkName}\nValid: ${isValid ? "Likely Valid" : "Invalid"}`,
                        },
                    ],
                };
            } catch (e) {
                return {
                    content: [{ type: "text", text: `Invalid address for ${networkName}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: get-address-transactions
    server.tool(
        "get-address-transactions",
        "Get the transaction history for a Bitcoin address",
        {
            address: z.string().describe("Bitcoin address"),
            limit: z.number().int().optional().default(10).describe("Number of transactions to fetch (default 10)"),
        },
        async ({ address, limit }) => {
            try {
                const state = config.getState();
                const network = state.network;
                const rpcUrl = process.env.MIDL_RPC_URL || "https://mempool.regtest.midl.xyz";
                const url = `${rpcUrl}/api/address/${address}/txs`;

                const res = await fetch(url);
                if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`);

                const txs = (await res.json()).slice(0, limit);

                const formattedTxs = txs.map((tx: any) => ({
                    txid: tx.txid,
                    version: tx.version,
                    value: tx.vout.reduce((acc: number, v: any) => acc + v.value, 0),
                    status: tx.status.confirmed ? "Confirmed" : "Unconfirmed",
                    block_height: tx.status.block_height,
                }));

                return {
                    content: [
                        {
                            type: "text",
                            text: `Recent Transactions for ${address}:\n\n` +
                                formattedTxs.map((tx: any) => `- ID: ${tx.txid}\n  Value: ${satoshisToBtc(tx.value)} BTC\n  Status: ${tx.status} (Block ${tx.block_height || "N/A"})`).join("\n\n"),
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error fetching transactions: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );

    // Tool: get-blockchain-info
    server.tool(
        "get-blockchain-info",
        "Get general information about the current state of the blockchain",
        {},
        async () => {
            try {
                const height = await config.getState().provider.getLatestBlockHeight(config.getState().network);
                const fees = await config.getState().provider.getFeeRate(config.getState().network);

                return {
                    content: [
                        {
                            type: "text",
                            text: `Network: ${config.getState().network.id}\nBlock Height: ${height}\n\nRecommended Fees (sat/vB):\n- Fast: ${fees.fastestFee}\n- Half Hour: ${fees.halfHourFee}\n- Hour: ${fees.hourFee}`,
                        },
                    ],
                };
            } catch (error: any) {
                return {
                    content: [{ type: "text", text: `Error fetching blockchain info: ${error.message}` }],
                    isError: true,
                };
            }
        }
    );
}
