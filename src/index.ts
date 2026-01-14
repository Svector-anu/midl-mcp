import { MidlMcpServer } from "./server.js";
import { MidlConfigWrapper } from "./config/midl-config.js";

/**
 * Main entry point for the MIDL MCP server.
 * 
 * In a real-world scenario, the pre-connected 'config' would be loaded 
 * from a secure storage or passed during initialization.
 * 
 * For this implementation, we assume the user provides the configuration context.
 */
async function main() {
    try {
        // Note: This is where the externally established config would be provided.
        // For local development/demo, this would be initialized with a mock or specific connector.
        console.error("Starting MIDL MCP Server...");

        // Placeholder: Initialize with a dummy config that passes validation for demonstration 
        // in a real environment, this object would come from @midl/core's createConfig and connect.
        const mockConfig: any = {
            getState: () => ({
                connection: {},
                network: { network: "testnet" },
                accounts: [{ address: "tb1qtestaddress" }]
            })
        };

        const midlWrapper = new MidlConfigWrapper(mockConfig);
        const server = new MidlMcpServer(midlWrapper);

        await server.runStdio();
    } catch (error: any) {
        console.error("Failed to start MIDL MCP Server:", error.message);
        process.exit(1);
    }
}

main();
