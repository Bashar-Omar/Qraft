import { describe, expect, it } from "vitest";

import { LazyBwipBarcodeRenderer } from "@/engines/render/bwip/lazy-bwip-barcode-renderer";

describe("lazy BWIP barcode renderer", () => {
  it("advertises only the engine-backed Phase 4B proof symbologies", () => {
    const renderer = new LazyBwipBarcodeRenderer();

    expect(renderer.supports({ symbology: "code128", payload: "ABC" })).toBe(true);
    expect(renderer.supports({ symbology: "datamatrix", payload: "ABC" })).toBe(true);
    expect(renderer.supports({ symbology: "qr", payload: "ABC" })).toBe(false);
  });
});
