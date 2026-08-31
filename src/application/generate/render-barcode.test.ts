import { describe, expect, it } from "vitest";

import { createRenderBarcode } from "@/application/generate/render-barcode";
import {
  CodeRenderError,
  type CodeRenderer,
  type RenderRequest,
  type RenderedBarcodeCode,
} from "@/core/code/render";
import { symbologyRegistry } from "@/core/code/symbology-registry";

class FakeBarcodeRenderer implements CodeRenderer<RenderedBarcodeCode> {
  readonly id = "fake-barcode";
  readonly requests: RenderRequest[] = [];

  supports(request: RenderRequest): boolean {
    return request.symbology !== "qr";
  }

  async render(request: RenderRequest): Promise<RenderedBarcodeCode> {
    this.requests.push(request);
    if (request.symbology === "qr") {
      throw new CodeRenderError("unsupported", "QR not supported by fake barcode renderer.");
    }

    return {
      width: request.symbology === "code128" ? 120 : 18,
      height: request.symbology === "code128" ? 50 : 18,
      svg: `<svg viewBox="0 0 ${request.symbology === "code128" ? "120 50" : "18 18"}"/>`,
      metadata: {
        rendererId: this.id,
        symbology: request.symbology,
        payloadBytes: request.payload.length,
        humanReadableText: request.options?.humanReadableText ?? false,
        quietZoneModules:
          request.symbology === "code128"
            ? { top: 0, right: 10, bottom: 0, left: 10 }
            : { top: 1, right: 1, bottom: 1, left: 1 },
      },
    };
  }
}

describe("render barcode use case", () => {
  it("derives presentation defaults from symbology capabilities", async () => {
    const renderer = new FakeBarcodeRenderer();
    const renderBarcode = createRenderBarcode({ symbologies: symbologyRegistry, renderer });

    const code128 = await renderBarcode({ symbology: "code128", payload: "ABC123" });
    const datamatrix = await renderBarcode({ symbology: "datamatrix", payload: "ABC123" });

    expect(code128.symbology.id).toBe("code128");
    expect(code128.rendered.metadata.humanReadableText).toBe(true);
    expect(datamatrix.rendered.metadata.humanReadableText).toBe(false);
    expect(renderer.requests[0]).toMatchObject({ options: { humanReadableText: true } });
    expect(renderer.requests[1]).toMatchObject({ options: { humanReadableText: false } });
  });

  it("validates content before the renderer boundary", async () => {
    const renderer = new FakeBarcodeRenderer();
    const renderBarcode = createRenderBarcode({ symbologies: symbologyRegistry, renderer });

    await expect(renderBarcode({ symbology: "code128", payload: "Café" })).rejects.toMatchObject({
      code: "invalid-request",
    });
    expect(renderer.requests).toHaveLength(0);
  });

  it("rejects capability-incompatible options at the application boundary", async () => {
    const renderer = new FakeBarcodeRenderer();
    const renderBarcode = createRenderBarcode({ symbologies: symbologyRegistry, renderer });

    await expect(
      renderBarcode({ symbology: "datamatrix", payload: "ABC", humanReadableText: true }),
    ).rejects.toMatchObject({ code: "invalid-request" });
    expect(renderer.requests).toHaveLength(0);
  });
});
