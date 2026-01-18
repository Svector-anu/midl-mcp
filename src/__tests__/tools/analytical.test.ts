import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerTools } from "../../tools/analytical.js";
import { MidlConfigWrapper } from "../../config/midl-config.js";
import * as midlCore from "@midl/core";
import coinSelect from "bitcoinselect";

vi.mock("@midl/core", () => ({
    getFeeRate: vi.fn(),
    getUTXOs: vi.fn(),
    getDefaultAccount: vi.fn(),
}));

vi.mock("bitcoinselect", () => ({
    default: vi.fn(),
}));

describe("Analytical Tools", () => {
    let mockServer: any;
    let mockMidl: MidlConfigWrapper;
    const tools: Record<string, Function> = {};

    beforeEach(() => {
        mockServer = {
            tool: vi.fn().mockImplementation((name, description, schema, handler) => {
                tools[name] = handler;
            }),
        };
        mockMidl = {
            getConfig: vi.fn().mockReturnValue({
                getState: vi.fn().mockReturnValue({ accounts: [{ address: "addr1" }] }),
            }),
        } as any;
        registerTools(mockServer, mockMidl);
    });

    it("should register analytical tools", () => {
        expect(mockServer.tool).toHaveBeenCalledWith("estimate-btc-transfer-fee", expect.any(String), expect.any(Object), expect.any(Function));
        expect(mockServer.tool).toHaveBeenCalledWith("decode-psbt", expect.any(String), expect.any(Object), expect.any(Function));
    });

    it("should handle estimate-btc-transfer-fee", async () => {
        const mockAccount = { address: "addr1" };
        vi.mocked(midlCore.getFeeRate).mockResolvedValue({ hourFee: 10 } as any);
        vi.mocked(midlCore.getUTXOs).mockResolvedValue([]);
        vi.mocked(midlCore.getDefaultAccount).mockReturnValue(mockAccount as any);
        vi.mocked(coinSelect).mockReturnValue({ fee: 500, inputs: [{}], outputs: [{}] } as any);

        const handler = tools["estimate-btc-transfer-fee"];
        const result = await handler({ recipients: [{ address: "addr2", amount: 1000 }] });

        expect(result.content[0].text).toContain("500 satoshis");
    });
});
