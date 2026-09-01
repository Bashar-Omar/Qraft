import { describe, expect, it } from "vitest";

import type { RenderedCode } from "@/core/code/render";
import {
  DEFAULT_RASTER_PIXEL_SIZE,
  parseRasterPixelSize,
  resolveRasterDimensions,
  resolveRasterPixelSize,
} from "@/core/export/raster";

const rendered: RenderedCode = {
  width: 29,
  height: 29,
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
const rectangularBarcode: RenderedCode = {
  width: 242,
  height: 200,
  svg: '<svg viewBox="0 0 242 200" xmlns="http://www.w3.org/2000/svg"/>',
  metadata: {
    rendererId: "test-barcode",
    symbology: "code128",
    payloadBytes: 10,
    humanReadableText: true,
    quietZoneModules: { top: 0, right: 10, bottom: 0, left: 10 },
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

  it("preserves rectangular artifact geometry for future barcode renderers", () => {
    expect(resolveRasterDimensions(rectangularBarcode, 512)).toEqual({
      width: 484,
      height: 400,
    });
    expect(resolveRasterDimensions(rectangularBarcode, 1024)).toEqual({
      width: 968,
      height: 800,
    });
    expect(() => resolveRasterPixelSize(rectangularBarcode, 1024)).toThrow(/square artifacts/i);
  });

  it("never downsamples a barcode below its canonical SVG pixel grid", () => {
    const wideBarcode: RenderedCode = { ...rectangularBarcode, width: 1200, height: 120 };
    expect(resolveRasterDimensions(wideBarcode, 512)).toEqual({ width: 1200, height: 120 });
  });
});
