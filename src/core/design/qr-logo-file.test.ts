import { describe, expect, it } from "vitest";

import { QrLogoFileValidationError, inspectQrLogoFileBytes } from "@/core/design/qr-logo-file";

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return bytes;
}

function jpegHeader(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00,
    0xff,
    0xd9,
  ]);
}

function webpVp8xHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(30);
  bytes.set(
    Array.from("RIFF", (value) => value.charCodeAt(0)),
    0,
  );
  bytes.set(
    Array.from("WEBP", (value) => value.charCodeAt(0)),
    8,
  );
  bytes.set(
    Array.from("VP8X", (value) => value.charCodeAt(0)),
    12,
  );
  const widthMinusOne = width - 1;
  const heightMinusOne = height - 1;
  bytes[24] = widthMinusOne & 0xff;
  bytes[25] = (widthMinusOne >> 8) & 0xff;
  bytes[26] = (widthMinusOne >> 16) & 0xff;
  bytes[27] = heightMinusOne & 0xff;
  bytes[28] = (heightMinusOne >> 8) & 0xff;
  bytes[29] = (heightMinusOne >> 16) & 0xff;
  return bytes;
}

describe("QR logo file inspection", () => {
  it("reads real raster signatures and dimensions without trusting a filename", () => {
    expect(inspectQrLogoFileBytes(pngHeader(640, 320), 120_000)).toMatchObject({
      mimeType: "image/png",
      width: 640,
      height: 320,
    });
    expect(inspectQrLogoFileBytes(jpegHeader(800, 600), 220_000)).toMatchObject({
      mimeType: "image/jpeg",
      width: 800,
      height: 600,
    });
    expect(inspectQrLogoFileBytes(webpVp8xHeader(512, 256), 80_000)).toMatchObject({
      mimeType: "image/webp",
      width: 512,
      height: 256,
    });
  });

  it("rejects SVG/text bytes instead of treating the file input accept hint as validation", () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>');

    expect(() => inspectQrLogoFileBytes(svg, svg.length)).toThrow(QrLogoFileValidationError);
  });

  it("rejects oversized dimensions and oversized files before browser image decoding", () => {
    expect(() => inspectQrLogoFileBytes(pngHeader(5000, 200), 100_000)).toThrow(/dimensions/i);
    expect(() => inspectQrLogoFileBytes(pngHeader(100, 100), 4 * 1024 * 1024 + 1)).toThrow(
      /4 MiB/i,
    );
  });
});
