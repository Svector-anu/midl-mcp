import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getBalance, getUTXOs, getBlockNumber } from "@midl/core";
import { MidlConfigWrapper } from "../config/midl-config.js";
import { formatBalance } from "../utils/formatters.js";

/**
 * Registers read-only resources on the McpServer.
 */
export function registerResources(server: McpServer, midl: MidlConfigWrapper) {
    const config = midl.getConfig();

    // Resource: midl://balance/{address}
    server.resource(
        "bitcoin-balance",
        "midl://balance/{address}",
        {
            title: "Bitcoin Balance",
            description: "Get the current BTC balance of an address",
        },
        async (uri) => {
            const address = uri.pathname.split("/").pop();
            if (!address) throw new Error("Missing address");
            const balanceSats = await getBalance(config, address);
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: `Balance for ${address}: ${formatBalance(balanceSats)}`,
                        mimeType: "text/plain",
                    },
                ],
            };
        }
    );

    // Resource: midl://utxos/{address}
    server.resource(
        "bitcoin-utxos",
        "midl://utxos/{address}",
        {
            title: "Bitcoin UTXOs",
            description: "Get the list of UTXOs for an address",
        },
        async (uri) => {
            const address = uri.pathname.split("/").pop();
            if (!address) throw new Error("Missing address");
            const utxos = await getUTXOs(config, address);
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: JSON.stringify(utxos, null, 2),
                        mimeType: "application/json",
                    },
                ],
            };
        }
    );

    // Resource: midl://block-height
    server.resource(
        "bitcoin-block-height",
        "midl://block-height",
        {
            title: "Bitcoin Block Height",
            description: "Get the current block height of the connected network",
        },
        async (uri) => {
            const blockHeight = await getBlockNumber(config);
            return {
                contents: [
                    {
                        uri: uri.href,
                        text: `Current Block Height: ${blockHeight}`,
                        mimeType: "text/plain",
                    },
                ],
            };
        }
    );
}
