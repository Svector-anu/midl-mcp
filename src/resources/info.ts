import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getFeeRate, getDefaultAccount, getRune, getRuneBalance } from "@midl/core";
import { MidlConfigWrapper } from "../config/midl-config.js";

/**
 * Registers remaining read-only resources on the McpServer.
 */
export function registerExtraResources(server: McpServer, midl: MidlConfigWrapper) {
    const config = midl.getConfig();

    // Resource: midl://fee-rates
    server.resource(
        "bitcoin-fee-rates",
        "midl://fee-rates",
        {
            title: "Bitcoin Fee Rates",
            description: "Get current recommended fee rates",
        },
        async (uri) => {
            const fees = await getFeeRate(config);
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify(fees, null, 2),
                        mimeType: "application/json",
                    },
                ],
            };
        }
    );

    // Resource: midl://network
    server.resource(
        "network-info",
        "midl://network",
        {
            title: "Network Info",
            description: "Get info about the connected Bitcoin network",
        },
        async (uri) => {
            const state = config.getState();
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify(state.network, null, 2),
                        mimeType: "application/json",
                    },
                ],
            };
        }
    );

    // Resource: midl://account
    server.resource(
        "account-info",
        "midl://account",
        {
            title: "Default Account Info",
            description: "Get information about the connected default account",
        },
        async (uri) => {
            const account = getDefaultAccount(config);
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify(account, null, 2),
                        mimeType: "application/json",
                    },
                ],
            };
        }
    );

    // Resource: midl://rune/{runeId}
    server.resource(
        "rune-info",
        "midl://rune/{runeId}",
        {
            title: "Rune Information",
            description: "Get metadata for a specific Rune",
        },
        async (uri) => {
            const runeId = uri.pathname.replace(/^\//, "");
            const rune = await getRune(config, runeId);
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify(rune, null, 2),
                        mimeType: "application/json",
                    },
                ],
            };
        }
    );

    // Resource: midl://rune-balance/{address}/{runeId}
    server.resource(
        "rune-balance",
        "midl://rune-balance/{address}/{runeId}",
        {
            title: "Rune Balance",
            description: "Get the balance of a specific Rune for an address",
        },
        async (uri) => {
            const parts = uri.pathname.replace(/^\//, "").split("/");
            const address = parts[0];
            const runeId = parts[1];
            if (!address || !runeId) throw new Error("Missing address or runeId");
            const balance = await getRuneBalance(config, { address, runeId });
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: `Rune Balance for ${address} (${runeId}): ${balance}`,
                        mimeType: "text/plain",
                    },
                ],
            };
        }
    );
}
