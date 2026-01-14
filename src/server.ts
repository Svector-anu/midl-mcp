import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MidlConfigWrapper } from "./config/midl-config.js";
import { registerResources } from "./resources/bitcoin.js";
import { registerExtraResources } from "./resources/info.js";
import { registerTools } from "./tools/analytical.js";
import { registerActionableTools } from "./tools/actionable.js";

/**
 * MIDL MCP Server Class
 */
export class MidlMcpServer {
    private server: McpServer;
    private midlWrapper: MidlConfigWrapper;

    constructor(midlWrapper: MidlConfigWrapper) {
        this.midlWrapper = midlWrapper;
        this.server = new McpServer({
            name: "midl-mcp-server",
            version: "1.0.0",
        });

        this.setupResources();
        this.setupTools();
        this.setupPrompts();
    }

    /**
     * Sets up read-only resources.
     */
    private setupResources() {
        registerResources(this.server, this.midlWrapper);
        registerExtraResources(this.server, this.midlWrapper);
    }

    /**
     * Sets up analytical and actionable tools.
     */
    private setupTools() {
        registerTools(this.server, this.midlWrapper);
        registerActionableTools(this.server, this.midlWrapper);
    }

    /**
     * Sets up prompts.
     */
    private setupPrompts() {
        // Prompts will be registered here in Phase 4
    }

    /**
     * Starts the server using stdio transport.
     */
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("MIDL MCP Server running on stdio");
    }

    /**
     * Expose the underlying McpServer for registration.
     */
    getMcpServer(): McpServer {
        return this.server;
    }

    /**
     * Expose the MIDL config wrapper.
     */
    getMidlWrapper(): MidlConfigWrapper {
        return this.midlWrapper;
    }
}
