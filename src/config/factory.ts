import { createConfig, MempoolSpaceProvider, MaestroSymphonyProvider, AddressPurpose } from "@midl/core";
import { ServerConnector } from "./connector.js";

/**
 * Creates a MIDL.js Config instance from environment variables.
 */
export async function createMidlConfigFromEnv() {
    const networkId = (process.env.MIDL_NETWORK || "testnet") as any;
    const address = process.env.MIDL_ACCOUNT_ADDRESS;
    const publicKey = process.env.MIDL_ACCOUNT_PUBKEY || ""; // Empty pubkey allows read-only balance but limits signing

    if (!address) {
        console.warn("MIDL_ACCOUNT_ADDRESS not set. Server will start in demo/mock mode.");
        return null;
    }

    // Determine the base bitcoin network name used by midl-js
    let bitcoinNetwork: "bitcoin" | "testnet" | "regtest" = "testnet";
    if (networkId === "mainnet") bitcoinNetwork = "bitcoin";
    else if (networkId === "regtest") bitcoinNetwork = "regtest";

    // Determine the explorer URL
    let explorerUrl = `https://mempool.space/${networkId === "mainnet" ? "" : networkId + "/"}tx/`;
    if (networkId === "regtest") {
        explorerUrl = "https://mempool.regtest.midl.xyz/tx/";
    } else if (networkId === "testnet4") {
        explorerUrl = "https://mempool.space/testnet4/tx/";
    } else if (networkId === "signet") {
        explorerUrl = "https://mempool.space/signet/tx/";
    }

    const networks: any[] = [
        {
            id: networkId,
            network: bitcoinNetwork,
            explorerUrl
        }
    ];

    // Custom RPC URL support
    const rpcUrl = process.env.MIDL_RPC_URL;
    const rpcMap = rpcUrl ? { [networkId]: rpcUrl } : undefined;

    const connector = new ServerConnector(address, publicKey);

    const config = createConfig({
        networks,
        connectors: [{
            id: connector.id,
            metadata: { name: "Server Connector" },
            create: () => connector
        } as any],
        provider: new MempoolSpaceProvider(rpcMap as any),
        runesProvider: new MaestroSymphonyProvider(),
        defaultPurpose: AddressPurpose.Ordinals
    });

    // Manually "connect" the store state so resources can find the account
    config.setState({
        connection: connector,
        accounts: [
            {
                address,
                publicKey,
                purpose: AddressPurpose.Ordinals,
                addressType: "p2tr" as any
            },
            {
                address,
                publicKey,
                purpose: AddressPurpose.Payment,
                addressType: "p2tr" as any
            }
        ]
    });

    return config;
}
