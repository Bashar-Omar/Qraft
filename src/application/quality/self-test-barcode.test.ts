import { describe, expect, it } from "vitest";

import { createSelfTestBarcode } from "@/application/quality/self-test-barcode";
import type { RenderedBarcodeCode } from "@/core/code/render";
import type {
  BarcodeArtifactDecodeRequest,
  BarcodeArtifactDecoder,
} from "@/core/quality/self-test";

const rendered: RenderedBarcodeCode = {
  width: 200,
  height: 60,
  svg: '<svg viewBox="0 0 200 60"></svg>',
  metadata: {
    rendererId: "bwip",
    symbology: "code128",
    payloadBytes: 8,
    humanReadableText: true,
    quietZoneModules: { top: 0, right: 10, bottom: 0, left: 10 },
  },
};

class FakeDecoder implements BarcodeArtifactDecoder {
  readonly id = "fake-zxing";
  request?: BarcodeArtifactDecodeRequest;

  constructor(
    private readonly result: string,
    private readonly fail = false,
  ) {}

  async decodeSvg(request: BarcodeArtifactDecodeRequest): Promise<string> {
    this.request = request;
    if (this.fail) throw new Error("decode failed");
    return this.result;
  }
}

describe("barcode final-artifact self-test", () => {
  it("decodes the final SVG at bounded aspect-ratio-preserving dimensions", async () => {
    const decoder = new FakeDecoder("QRAFT128");
    const selfTest = createSelfTestBarcode(decoder);

    await expect(selfTest({ rendered, expectedPayload: "QRAFT128" })).resolves.toEqual({
      status: "passed",
      decoderId: "fake-zxing",
    });
    expect(decoder.request).toMatchObject({
      symbology: "code128",
      width: 1400,
      height: 420,
    });
  });

  it("distinguishes payload mismatch from decode failure", async () => {
    const mismatch = createSelfTestBarcode(new FakeDecoder("OTHER"));
    await expect(mismatch({ rendered, expectedPayload: "QRAFT128" })).resolves.toMatchObject({
      status: "failed",
      reason: "payload-mismatch",
    });

    const failed = createSelfTestBarcode(new FakeDecoder("", true));
    await expect(failed({ rendered, expectedPayload: "QRAFT128" })).resolves.toMatchObject({
      status: "failed",
      reason: "decode-failed",
    });
  });
});
