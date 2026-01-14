import { MidlMcpServer } from "./server.js";
import { MidlConfigWrapper } from "./config/midl-config.js";
import { createMidlConfigFromEnv } from "./config/factory.js";

/**
 * Main entry point for the MIDL MCP server.
 */
async function main() {
    try {
        console.error("Starting MIDL MCP Server...");

        // Attempt to load real config from environment
        let midlConfig = await createMidlConfigFromEnv();

        if (!midlConfig) {
            console.error("Using MOCK/DEMO mode (MIDL_ACCOUNT_ADDRESS not found)");
            // Fallback to mock for demonstration/testing
            const mock: any = {
                getState: () => ({
                    connection: {},
                    network: { network: "testnet", id: "testnet" },
                    accounts: [{ address: "tb1qtestaddress" }]
                })
            };
            midlConfig = mock;
        } else {
            const address = midlConfig.getState().accounts?.[0]?.address;
            console.error("Real Wallet context established for:", address);
        }

        const midlWrapper = new MidlConfigWrapper(midlConfig as any);
        const server = new MidlMcpServer(midlWrapper);

        await server.runStdio();
    } catch (error: any) {
        console.error("Failed to start MIDL MCP Server:", error.message);
        process.exit(1);
    }
}

main();
