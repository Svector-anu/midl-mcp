import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerExtraResources } from "../../resources/info.js";
import { MidlConfigWrapper } from "../../config/midl-config.js";
import * as midlCore from "@midl/core";

vi.mock("@midl/core", () => ({
    getFeeRate: vi.fn(),
    getDefaultAccount: vi.fn(),
    getRune: vi.fn(),
    getRuneBalance: vi.fn(),
}));

describe("Extra Resources", () => {
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
            getConfig: vi.fn().mockReturnValue({
                getState: vi.fn().mockReturnValue({ network: { network: "testnet" } }),
            }),
        } as any;
        registerExtraResources(mockServer, mockMidl);
    });

    it("should handle rune-info request", async () => {
        const runeId = "TEST_RUNE";
        const mockRune = { id: runeId, symbol: "T" };
        vi.mocked(midlCore.getRune).mockResolvedValue(mockRune);

        const handler = handlers["rune-info"];
        const uri = new URL(`midl://rune/${runeId}`);
        const result = await handler(uri);

        expect(midlCore.getRune).toHaveBeenCalledWith(expect.anything(), runeId);
        expect(JSON.parse(result.contents[0].text)).toEqual(mockRune);
    });

    it("should handle rune-balance request", async () => {
        const address = "addr1";
        const runeId = "rune1";
        const balance = "1000";
        vi.mocked(midlCore.getRuneBalance).mockResolvedValue(balance);

        const handler = handlers["rune-balance"];
        const uri = new URL(`midl://rune-balance/${address}/${runeId}`);
        const result = await handler(uri);

        expect(midlCore.getRuneBalance).toHaveBeenCalledWith(expect.anything(), { address, runeId });
        expect(result.contents[0].text).toContain(balance);
    });
});
