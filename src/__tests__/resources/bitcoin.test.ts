import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerResources } from "../../resources/bitcoin.js";
import { MidlConfigWrapper } from "../../config/midl-config.js";
import * as midlCore from "@midl/core";

vi.mock("@midl/core", () => ({
    getBalance: vi.fn(),
    getUTXOs: vi.fn(),
    getBlockNumber: vi.fn(),
}));

describe("Bitcoin Resources", () => {
    let mockServer: any;
    let mockMidl: MidlConfigWrapper;
    const handlers: Record<string, Function> = {};

    beforeEach(() => {
        mockServer = {
            resource: vi.fn().mockImplementation((name, pattern, options, handler) => {
                handlers[name] = handler;
            }),
        };
        mockMidl = {
            getConfig: vi.fn().mockReturnValue({}),
            getNetworkName: vi.fn().mockReturnValue("testnet"),
        } as any;
        registerResources(mockServer, mockMidl);
    });

    it("should register bitcoin-balance, bitcoin-utxos, and bitcoin-block-height", () => {
        expect(mockServer.resource).toHaveBeenCalledWith("bitcoin-balance", expect.any(String), expect.any(Object), expect.any(Function));
        expect(mockServer.resource).toHaveBeenCalledWith("bitcoin-utxos", expect.any(String), expect.any(Object), expect.any(Function));
        expect(mockServer.resource).toHaveBeenCalledWith("bitcoin-block-height", expect.any(String), expect.any(Object), expect.any(Function));
    });

    it("should handle bitcoin-balance request", async () => {
        const address = "tb1qtestaddress";
        const balanceSats = 1000000;
        vi.mocked(midlCore.getBalance).mockResolvedValue(balanceSats);

        const handler = handlers["bitcoin-balance"];
        const uri = new URL(`midl://balance/${address}`);
        const result = await handler(uri, {});

        expect(midlCore.getBalance).toHaveBeenCalledWith(expect.anything(), address);
        expect(result.contents[0].text).toContain("0.01000000 BTC");
        expect(result.contents[0].text).toContain(address);
    });

    it("should handle bitcoin-utxos request", async () => {
        const address = "tb1qtestaddress";
        const mockUtxos = [{ txId: "tx1", vout: 0, value: 500 }];
        vi.mocked(midlCore.getUTXOs).mockResolvedValue(mockUtxos);

        const handler = handlers["bitcoin-utxos"];
        const uri = new URL(`midl://utxos/${address}`);
        const result = await handler(uri, {});

        expect(midlCore.getUTXOs).toHaveBeenCalledWith(expect.anything(), address);
        expect(JSON.parse(result.contents[0].text)).toEqual(mockUtxos);
    });

    it("should handle bitcoin-block-height request", async () => {
        const blockHeight = 123456;
        vi.mocked(midlCore.getBlockNumber).mockResolvedValue(blockHeight);

        const handler = handlers["bitcoin-block-height"];
        const uri = new URL("midl://block-height");
        const result = await handler(uri);

        expect(midlCore.getBlockNumber).toHaveBeenCalled();
        expect(result.contents[0].text).toContain(blockHeight.toString());
    });
});
