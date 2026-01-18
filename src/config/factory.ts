import { createConfig, MempoolSpaceProvider, MaestroSymphonyProvider, AddressPurpose } from "@midl/core";
import { ServerConnector } from "./connector.js";

/**
 * Creates a MIDL.js Config instance from environment variables.
 */
export async function createMidlConfigFromEnv() {
    const networkId = (process.env.MIDL_NETWORK || "testnet") as any;
    const address = process.env.MIDL_ACCOUNT_ADDRESS;
    let publicKey = process.env.MIDL_ACCOUNT_PUBKEY || "";

    if (!address) {
        console.warn("MIDL_ACCOUNT_ADDRESS not set. Server will start in demo/mock mode.");
        return null;
    }

    // Auto-recover public key if missing and has on-chain history
    if (!publicKey || publicKey === "NOT_SET" || publicKey.includes("...")) {
        try {
            console.error(`Attempting to recover public key for ${address}...`);
            const baseUrl = networkId === "regtest" ? "https://mempool.regtest.midl.xyz" : `https://mempool.space/${networkId === "mainnet" ? "" : networkId + "/"}`;
            const res = await fetch(`${baseUrl}/api/address/${address}/txs`);
            if (res.ok) {
                const txs = await res.json() as any[];
                for (const tx of txs) {
                    const vin = tx.vin.find((v: any) => v.prevout?.scriptpubkey_address === address);
                    if (vin && vin.witness && vin.witness.length >= 2) {
                        publicKey = vin.witness[vin.witness.length - 1];
                        console.error(`Successfully recovered public key: ${publicKey}`);
                        break;
                    }
                }
            }
        } catch (e) {
            console.error("Public key recovery failed:", e);
        }
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
