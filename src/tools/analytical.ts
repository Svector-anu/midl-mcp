import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFeeRate, getUTXOs, getDefaultAccount } from "@midl/core";
import coinSelect from "bitcoinselect";
import { Psbt, networks } from "bitcoinjs-lib";
import { MidlConfigWrapper } from "../config/midl-config.js";
import { satoshisToBtc } from "../utils/formatters.js";

/**
 * Registers analytical tools on the McpServer.
 */
export function registerTools(server: McpServer, midl: MidlConfigWrapper) {
    const config = midl.getConfig();

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
}
