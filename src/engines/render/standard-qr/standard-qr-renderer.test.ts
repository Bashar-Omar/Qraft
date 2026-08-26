import { describe, expect, it } from "vitest";

import { standardQrRenderer } from "@/engines/render/standard-qr/standard-qr-renderer";
import { decodeQrMatrixForGoldenTest } from "@/test/qr-golden";

describe("standardQrRenderer", () => {
  it("renders a QR with the safe four-module quiet zone", async () => {
    const rendered = await standardQrRenderer.render({
      symbology: "qr",
      payload: "https://example.com",
      options: { errorCorrectionLevel: "M", quietZoneModules: 4 },
    });

    expect(rendered.metadata.quietZoneModules).toBe(4);
    expect(rendered.metadata.errorCorrectionLevel).toBe("M");
    expect(rendered.metadata.version).toBeGreaterThanOrEqual(1);
    expect(rendered.verificationMatrix.length).toBe(rendered.metadata.symbolModules + 8);
  });

  it("round-trips UTF-8 payloads through the golden decoder", async () => {
    const payload = "Qraft — مرحبًا 👋";
    const rendered = await standardQrRenderer.render({
      symbology: "qr",
      payload,
      options: { errorCorrectionLevel: "Q", quietZoneModules: 4 },
    });

    expect(decodeQrMatrixForGoldenTest(rendered.verificationMatrix)).toBe(payload);
  });
});
