import { describe, expect, it } from "vitest";

import { LazyBwipBarcodeRenderer } from "@/engines/render/bwip/lazy-bwip-barcode-renderer";

describe("lazy BWIP barcode renderer", () => {
  it("advertises every curated engine-backed Phase 4D symbology", () => {
    const renderer = new LazyBwipBarcodeRenderer();
    const supported = [
      "code128",
      "code39",
      "code93",
      "itf",
      "itf14",
      "ean13",
      "ean8",
      "upca",
      "upce",
      "datamatrix",
      "pdf417",
      "aztec",
    ] as const;

    for (const symbology of supported) {
      expect(renderer.supports({ symbology, payload: "ABC" })).toBe(true);
    }
    expect(renderer.supports({ symbology: "qr", payload: "ABC" })).toBe(false);
  });
});
