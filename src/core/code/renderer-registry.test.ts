import { describe, expect, it } from "vitest";

import { RendererRegistry } from "@/core/code/renderer-registry";
import {
  type CodeRenderer,
  type RenderRequest,
  type RenderedBarcodeCode,
  type RenderedCode,
  type RenderedQrCode,
} from "@/core/code/render";

function qrFixture(rendererId: string): RenderedQrCode {
  return {
    width: 29,
    height: 29,
    verificationMatrix: [[false]],
    svg: '<svg viewBox="0 0 29 29"/>',
    metadata: {
      rendererId,
      symbology: "qr",
      errorCorrectionLevel: "M",
      quietZoneModules: 4,
      symbolModules: 21,
      totalModules: 29,
      version: 1,
      payloadBytes: 1,
    },
  };
}

function barcodeFixture(rendererId: string): RenderedBarcodeCode {
  return {
    width: 242,
    height: 100,
    svg: '<svg viewBox="0 0 242 100"/>',
    metadata: {
      rendererId,
      symbology: "code128",
      payloadBytes: 4,
      humanReadableText: true,
      quietZoneModules: { top: 0, right: 10, bottom: 0, left: 10 },
    },
  };
}

class FakeQrRenderer implements CodeRenderer<RenderedQrCode> {
  readonly id = "fake-qr";
  supports(request: RenderRequest): boolean {
    return request.symbology === "qr";
  }
  async render(): Promise<RenderedQrCode> {
    return qrFixture(this.id);
  }
}

class FakeBarcodeRenderer implements CodeRenderer<RenderedBarcodeCode> {
  readonly id = "fake-barcode";
  supports(request: RenderRequest): boolean {
    return request.symbology === "code128";
  }
  async render(): Promise<RenderedBarcodeCode> {
    return barcodeFixture(this.id);
  }
}

describe("renderer registry", () => {
  it("routes by renderer capability without application switches", async () => {
    const registry = new RendererRegistry<RenderedCode>([
      new FakeQrRenderer(),
      new FakeBarcodeRenderer(),
    ]);

    const qr = await registry.render({ symbology: "qr", payload: "x" });
    const barcode = await registry.render({ symbology: "code128", payload: "1234" });

    expect(qr.metadata.rendererId).toBe("fake-qr");
    expect(barcode.metadata.rendererId).toBe("fake-barcode");
  });

  it("fails explicitly when no installed adapter supports the symbology", async () => {
    const registry = new RendererRegistry([new FakeQrRenderer()]);

    await expect(
      registry.render({ symbology: "datamatrix", payload: "phase-4" }),
    ).rejects.toMatchObject({ code: "unsupported" });
  });
});
