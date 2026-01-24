import { type Connector, type Account, type ConnectorConnectParams } from "@midl/core";
import { AddressPurpose, AddressType } from "@midl/core";

/**
 * A server-side connector that uses environment-provided account details.
 * This connector does not hold private keys.
 */
export class ServerConnector implements Connector {
    readonly id = "server-connector";

    constructor(
        private readonly address: string,
        private readonly publicKey: string
    ) { }

    async connect(params: ConnectorConnectParams): Promise<Account[]> {
        // Return the account provided in the constructor for all requested purposes
        return params.purposes.map(purpose => ({
            address: this.address,
            publicKey: this.publicKey,
            purpose,
            addressType: AddressType.P2TR // Defaulting to Taproot (common for MIDL/Runes)
        }));
    }

    async signMessage(): Promise<any> {
        throw new Error("signMessage not supported by server-side connector. Use elicitation tools.");
    }

    async signPSBT(params: { psbt: string; signInputs: Record<string, number[]> }): Promise<{ psbt: string }> {
        // For MCP server: return the UNSIGNED PSBT for user to sign externally
        // This allows the SDK flow to complete while keeping the PSBT unsigned
        return { psbt: params.psbt };
    }
}
