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
      width: request.symbology === "datamatrix" ? 18 : 120,
      height: request.symbology === "datamatrix" ? 18 : 50,
      svg: `<svg viewBox="0 0 ${request.symbology === "datamatrix" ? "18 18" : "120 50"}"/>`,
      metadata: {
        rendererId: this.id,
        symbology: request.symbology,
        payloadBytes: request.payload.length,
        humanReadableText: request.options?.humanReadableText ?? false,
        quietZoneModules:
          request.symbology === "datamatrix"
            ? { top: 1, right: 1, bottom: 1, left: 1 }
            : { top: 0, right: 10, bottom: 0, left: 10 },
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

  it("canonicalizes retail check digits before the renderer and self-test boundary", async () => {
    const renderer = new FakeBarcodeRenderer();
    const renderBarcode = createRenderBarcode({ symbologies: symbologyRegistry, renderer });

    const result = await renderBarcode({ symbology: "ean13", payload: "952012345678" });

    expect(result.payload).toBe("9520123456788");
    expect(result.validation).toMatchObject({
      payload: "952012345678",
      encodedPayload: "9520123456788",
      checkDigit: { digit: "8", status: "computed" },
    });
    expect(renderer.requests[0]).toMatchObject({
      symbology: "ean13",
      payload: "9520123456788",
      options: { humanReadableText: true },
    });
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
