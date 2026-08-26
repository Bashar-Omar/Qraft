import { QR_LOGO_LIMITS } from "@/core/design/qr-logo";

export type QrLogoRasterMimeType = "image/png" | "image/jpeg" | "image/webp";

export type QrLogoFileInspection = Readonly<{
  mimeType: QrLogoRasterMimeType;
  width: number;
  height: number;
  bytes: number;
}>;

export class QrLogoFileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QrLogoFileValidationError";
  }
}

const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function dataView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function validateDimensions(width: number, height: number, bytes: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new QrLogoFileValidationError("The logo image has invalid dimensions.");
  }

  if (width > QR_LOGO_LIMITS.maxSourceDimension || height > QR_LOGO_LIMITS.maxSourceDimension) {
    throw new QrLogoFileValidationError(
      `Logo dimensions must not exceed ${QR_LOGO_LIMITS.maxSourceDimension}×${QR_LOGO_LIMITS.maxSourceDimension}px.`,
    );
  }

  if (width * height > QR_LOGO_LIMITS.maxSourcePixels) {
    throw new QrLogoFileValidationError(
      "The logo image contains too many pixels to process safely.",
    );
  }

  if (bytes > QR_LOGO_LIMITS.maxFileBytes) {
    throw new QrLogoFileValidationError("Logo files must be 4 MiB or smaller.");
  }
}

function inspectPng(bytes: Uint8Array): Readonly<{ width: number; height: number }> | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) {
    return null;
  }

  if (ascii(bytes, 12, 4) !== "IHDR") {
    throw new QrLogoFileValidationError("The PNG logo is missing a valid IHDR header.");
  }

  const view = dataView(bytes);
  return {
    width: view.getUint32(16, false),
    height: view.getUint32(20, false),
  };
}

function inspectJpeg(bytes: Uint8Array): Readonly<{ width: number; height: number }> | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;

  while (offset + 3 < bytes.length) {
    while (offset < bytes.length && bytes[offset] === 0xff) {
      offset += 1;
    }

    if (offset >= bytes.length) {
      break;
    }

    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd8 || marker === 0xd9) {
      continue;
    }

    if (marker === 0xda) {
      break;
    }

    if (offset + 1 >= bytes.length) {
      break;
    }

    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      throw new QrLogoFileValidationError("The JPEG logo has a malformed segment.");
    }

    if (JPEG_SOF_MARKERS.has(marker)) {
      if (segmentLength < 7) {
        throw new QrLogoFileValidationError("The JPEG logo has an invalid frame header.");
      }

      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }

    offset += segmentLength;
  }

  throw new QrLogoFileValidationError("Qraft could not find JPEG image dimensions.");
}

function inspectWebp(bytes: Uint8Array): Readonly<{ width: number; height: number }> | null {
  if (bytes.length < 30 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") {
    return null;
  }

  const chunk = ascii(bytes, 12, 4);

  if (chunk === "VP8X") {
    return {
      width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
      height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
    };
  }

  if (chunk === "VP8L") {
    if (bytes[20] !== 0x2f || bytes.length < 25) {
      throw new QrLogoFileValidationError("The WebP logo has an invalid lossless header.");
    }

    const b1 = bytes[21];
    const b2 = bytes[22];
    const b3 = bytes[23];
    const b4 = bytes[24];

    return {
      width: 1 + (((b2 & 0x3f) << 8) | b1),
      height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
    };
  }

  if (chunk === "VP8 ") {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
      throw new QrLogoFileValidationError("The WebP logo has an invalid lossy frame header.");
    }

    return {
      width: (bytes[26] | (bytes[27] << 8)) & 0x3fff,
      height: (bytes[28] | (bytes[29] << 8)) & 0x3fff,
    };
  }

  throw new QrLogoFileValidationError("This WebP logo uses an unsupported container layout.");
}

export function inspectQrLogoFileBytes(bytes: Uint8Array, fileBytes: number): QrLogoFileInspection {
  if (!Number.isInteger(fileBytes) || fileBytes < 1) {
    throw new QrLogoFileValidationError("The selected logo file is empty.");
  }

  if (fileBytes > QR_LOGO_LIMITS.maxFileBytes) {
    throw new QrLogoFileValidationError("Logo files must be 4 MiB or smaller.");
  }

  const png = inspectPng(bytes);
  if (png) {
    validateDimensions(png.width, png.height, fileBytes);
    return { mimeType: "image/png", width: png.width, height: png.height, bytes: fileBytes };
  }

  const jpeg = inspectJpeg(bytes);
  if (jpeg) {
    validateDimensions(jpeg.width, jpeg.height, fileBytes);
    return { mimeType: "image/jpeg", width: jpeg.width, height: jpeg.height, bytes: fileBytes };
  }

  const webp = inspectWebp(bytes);
  if (webp) {
    validateDimensions(webp.width, webp.height, fileBytes);
    return { mimeType: "image/webp", width: webp.width, height: webp.height, bytes: fileBytes };
  }

  throw new QrLogoFileValidationError("Use a real PNG, JPEG or WebP image for the QR logo.");
}
