import { describe, expect, it } from "vitest";

import type { RenderedCode } from "@/core/code/render";
import {
  DEFAULT_RASTER_PIXEL_SIZE,
  parseRasterPixelSize,
  resolveRasterPixelSize,
} from "@/core/export/raster";

const rendered: RenderedCode = {
  verificationMatrix: [],
  svg: '<svg xmlns="http://www.w3.org/2000/svg"/>',
  metadata: {
    rendererId: "test",
    symbology: "qr",
    errorCorrectionLevel: "M",
    quietZoneModules: 4,
    symbolModules: 21,
    totalModules: 29,
    version: 1,
    payloadBytes: 8,
  },
};

describe("raster export sizing", () => {
  it("accepts only the curated raster sizes", () => {
    expect(parseRasterPixelSize(DEFAULT_RASTER_PIXEL_SIZE)).toBe(1024);
    expect(parseRasterPixelSize(2048)).toBe(2048);
    expect(() => parseRasterPixelSize(1000)).toThrow(/512, 1024, 2048 or 4096/i);
  });

  it("aligns output size to an integer number of pixels per QR module", () => {
    expect(resolveRasterPixelSize(rendered, 512)).toBe(493);
    expect(resolveRasterPixelSize(rendered, 1024)).toBe(1015);
    expect(resolveRasterPixelSize(rendered, 2048)).toBe(2030);
  });
});
