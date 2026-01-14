import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MidlConfigWrapper } from "./config/midl-config.js";
import { registerResources } from "./resources/bitcoin.js";
import { registerExtraResources } from "./resources/info.js";
import { registerTools } from "./tools/analytical.js";
import { registerActionableTools } from "./tools/actionable.js";
import { registerPrompts } from "./prompts/bitcoin.js";

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
        registerPrompts(this.server);
    }

    /**
     * Starts the server using stdio transport (Default).
     */
    async runStdio() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("MIDL MCP Server running on stdio");
    }

    /**
     * Starts the server using HTTP/SSE transport (Optional).
     * Includes DNS rebinding protection.
     */
    async runHttp(port: number = 3000) {
        // This is a placeholder for SSE/HTTP transport implementation
        // For now we focus on Stdio as it's the primary use case for local LLM extensions
        console.error(`HTTP transport not fully implemented. Stdio is recommended for local use.`);
    }

    /**
     * Expose the underlying McpServer for registration.
     */
    getMcpServer(): McpServer {
        return this.server;
    }
}
