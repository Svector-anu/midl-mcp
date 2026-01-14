import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Registers prompts on the McpServer.
 */
export function registerPrompts(server: McpServer) {
    // Prompt: explain-transaction
    server.prompt(
        "explain-transaction",
        {
            txData: z.string().describe("Transaction hex, ID, or JSON representation to explain"),
        },
        (args) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please analyze and explain this Bitcoin transaction in human-readable terms. Detail the inputs, outputs, fee, and any MIDL Protocol metadata if present:\n\n${args.txData}`,
                    },
                },
            ],
        })
    );

    // Prompt: debug-transaction
    server.prompt(
        "debug-transaction",
        {
            error: z.string().describe("The error message encountered"),
            context: z.string().optional().describe("Additional context or transaction data"),
        },
        (args) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `I encountered an error while processing a Bitcoin transaction with MIDL.js. \n\nError: ${args.error}\nContext: ${args.context || "No additional context provided."}\n\nPlease help me debug this issue. What are the likely causes and how can I resolve it?`,
                    },
                },
            ],
        })
    );
}
