import { type Config } from "@midl/core";

/**
 * Wrapper for MIDL.js configuration to enforce safety invariants.
 */
export class MidlConfigWrapper {
    private config: Config;

    constructor(config: Config) {
        this.config = config;
        this.validateConfig();
    }

    /**
     * Validates that the configuration is pre-connected and on an allowed network.
     */
    private validateConfig() {
        const state = this.config.getState();

        if (!state.connection) {
            throw new Error("MIDL MCP Server requires a pre-connected wallet configuration.");
        }

        const network = state.network;
        if (!network) {
            throw new Error("No network configured in MIDL state.");
        }

        // Enforce testnet/regtest only as per user requirements
        const networkName = network.network.toLowerCase();
        const isTestnet = networkName.includes("testnet") || networkName.includes("regtest");

        if (!isTestnet) {
            throw new Error(`MIDL MCP Server is currently restricted to testnet/regtest. Detected network: ${networkName}`);
        }
    }

    /**
     * Gets the underlying MIDL configuration.
     */
    public getConfig(): Config {
        return this.config;
    }

    /**
     * Gets the current network name.
     */
    public getNetworkName(): string {
        return this.config.getState().network.network;
    }
}
