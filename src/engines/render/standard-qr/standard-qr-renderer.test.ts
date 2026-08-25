import { Bitmap } from "qr";
import decodeQR from "qr/decode.js";
import { describe, expect, it } from "vitest";

import type { QrMatrix } from "@/core/code/render";
import { standardQrRenderer } from "@/engines/render/standard-qr/standard-qr-renderer";

const GOLDEN_DECODE_SCALE = 4;

function scaleMatrixForDecode(matrix: QrMatrix, scale: number): boolean[][] {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new Error("Decode scale must be a positive integer.");
  }

  const scaled: boolean[][] = [];

  for (const row of matrix) {
    const expandedRow = row.flatMap((module) => Array<boolean>(scale).fill(module));

    for (let index = 0; index < scale; index += 1) {
      scaled.push([...expandedRow]);
    }
  }

  return scaled;
}

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
    expect(rendered.matrix.length).toBe(rendered.metadata.symbolModules + 8);
  });

  it("round-trips UTF-8 payloads through the golden decoder", async () => {
    const payload = "Qraft — مرحبًا 👋";
    const rendered = await standardQrRenderer.render({
      symbology: "qr",
      payload,
      options: { errorCorrectionLevel: "Q", quietZoneModules: 4 },
    });

    const data = scaleMatrixForDecode(rendered.matrix, GOLDEN_DECODE_SCALE);
    const bitmap = new Bitmap({ width: data[0].length, height: data.length }, data);

    expect(decodeQR(bitmap.toImage())).toBe(payload);
  });
});
