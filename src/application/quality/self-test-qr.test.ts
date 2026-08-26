import { describe, expect, it } from "vitest";

import { createSelfTestQr } from "@/application/quality/self-test-qr";
import type { RenderedCode } from "@/core/code/render";
import { DEFAULT_QR_DESIGN, parseQrDesign } from "@/core/design/qr-design";
import type { QrArtifactDecodeRequest, QrArtifactDecoder } from "@/core/quality/self-test";

const rendered: RenderedCode = {
  verificationMatrix: [[true]],
  svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 29"></svg>',
  metadata: {
    rendererId: "standard-qr",
    symbology: "qr",
    errorCorrectionLevel: "M",
    quietZoneModules: 4,
    symbolModules: 21,
    totalModules: 29,
    version: 1,
    payloadBytes: 12,
  },
};

class FakeDecoder implements QrArtifactDecoder {
  readonly id = "fake-decoder";
  lastRequest: QrArtifactDecodeRequest | null = null;

  constructor(
    private readonly result: string,
    private readonly shouldThrow = false,
  ) {}

  async decodeSvg(request: QrArtifactDecodeRequest): Promise<string> {
    this.lastRequest = request;

    if (this.shouldThrow) {
      throw new Error("decode failed");
    }

    return this.result;
  }
}

describe("selfTestQr", () => {
  it("passes only when the independently decoded raw payload matches exactly", async () => {
    const decoder = new FakeDecoder("https://qraft.test");
    const selfTestQr = createSelfTestQr(decoder);

    await expect(
      selfTestQr({
        rendered,
        design: DEFAULT_QR_DESIGN,
        expectedPayload: "https://qraft.test",
      }),
    ).resolves.toEqual({ status: "passed", decoderId: "fake-decoder" });
  });

  it("reports a decoded payload mismatch without exposing the payload in the result", async () => {
    const selfTestQr = createSelfTestQr(new FakeDecoder("different"));

    await expect(
      selfTestQr({
        rendered,
        design: DEFAULT_QR_DESIGN,
        expectedPayload: "expected",
      }),
    ).resolves.toEqual({
      status: "failed",
      decoderId: "fake-decoder",
      reason: "payload-mismatch",
    });
  });

  it("uses a white representative surface for transparent artifacts", async () => {
    const decoder = new FakeDecoder("payload");
    const selfTestQr = createSelfTestQr(decoder);
    const transparentDesign = parseQrDesign({
      ...DEFAULT_QR_DESIGN,
      background: { kind: "transparent" },
    });

    await selfTestQr({
      rendered,
      design: transparentDesign,
      expectedPayload: "payload",
    });

    expect(decoder.lastRequest?.backgroundColor).toBe("#ffffff");
    expect(decoder.lastRequest?.pixelSize).toBe(rendered.metadata.totalModules * 16);
    expect((decoder.lastRequest?.pixelSize ?? 0) % rendered.metadata.totalModules).toBe(0);
  });

  it("turns decoder failures into an explicit self-test failure", async () => {
    const selfTestQr = createSelfTestQr(new FakeDecoder("", true));

    await expect(
      selfTestQr({
        rendered,
        design: DEFAULT_QR_DESIGN,
        expectedPayload: "payload",
      }),
    ).resolves.toEqual({
      status: "failed",
      decoderId: "fake-decoder",
      reason: "decode-failed",
    });
  });
});
