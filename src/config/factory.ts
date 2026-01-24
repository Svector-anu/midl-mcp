import { createConfig, MempoolSpaceProvider, MaestroSymphonyProvider, AddressPurpose, connect } from "@midl/core";
import { keyPairConnector } from "@midl/node";
import { ServerConnector } from "./connector.js";

/**
 * Creates a MIDL.js Config instance from environment variables.
 *
 * Supports two modes:
 * 1. MNEMONIC mode: Provide MIDL_MNEMONIC for full signing capability
 * 2. ADDRESS mode: Provide MIDL_ACCOUNT_ADDRESS + MIDL_ACCOUNT_PUBKEY for unsigned PSBTs
 */
export async function createMidlConfigFromEnv() {
    const networkId = (process.env.MIDL_NETWORK || "testnet") as any;
    const mnemonic = process.env.MIDL_MNEMONIC;
    const address = process.env.MIDL_ACCOUNT_ADDRESS;
    let publicKey = process.env.MIDL_ACCOUNT_PUBKEY || "";

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

    // MODE 1: Mnemonic-based signing (full capability)
    if (mnemonic) {
        console.error("Using MNEMONIC mode - full signing capability enabled");

        const connector = keyPairConnector({
            mnemonic,
            metadata: { name: "MCP Server (Mnemonic)" }
        });

        const config = createConfig({
            networks,
            connectors: [connector],
            provider: new MempoolSpaceProvider(rpcMap as any),
            runesProvider: new MaestroSymphonyProvider(),
            defaultPurpose: AddressPurpose.Payment  // Use Payment account (where funds are)
        });

        // Connect using the mnemonic connector
        await connect(config, {
            connector: connector,
            purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment]
        });

        const accounts = config.getState().accounts || [];
        console.error(`Connected accounts:`);
        accounts.forEach((acc: any, i: number) => {
            console.error(`  [${i}] ${acc.address} (${acc.purpose}, ${acc.addressType})`);
        });
        const connectedAddress = accounts[0]?.address;

        return config;
    }

    // MODE 2: Address-only mode (unsigned PSBTs)
    if (!address) {
        console.warn("Neither MIDL_MNEMONIC nor MIDL_ACCOUNT_ADDRESS set. Server will start in demo/mock mode.");
        return null;
    }

    console.error("Using ADDRESS mode - will return unsigned PSBTs for external signing");

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
