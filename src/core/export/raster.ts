import { isRenderedQrCode, type RenderedCode } from "@/core/code/render";

export const RASTER_PIXEL_SIZES = [512, 1024, 2048, 4096] as const;
export type RasterPixelSize = (typeof RASTER_PIXEL_SIZES)[number];

export const DEFAULT_RASTER_PIXEL_SIZE: RasterPixelSize = 1024;

export type RasterDimensions = Readonly<{
  width: number;
  height: number;
}>;

export function parseRasterPixelSize(value: unknown): RasterPixelSize {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    !RASTER_PIXEL_SIZES.includes(value as RasterPixelSize)
  ) {
    throw new Error("Raster size must be one of 512, 1024, 2048 or 4096 pixels.");
  }

  return value as RasterPixelSize;
}

function validateNaturalDimension(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Rendered ${label} must be a positive finite number.`);
  }
  return value;
}

/**
 * Resolves a raster target while preserving the canonical artifact aspect ratio.
 *
 * QR keeps its historical integer pixels-per-module behavior exactly. Other
 * symbologies scale from their canonical SVG dimensions, preferring an integer
 * multiple when the natural artifact fits inside the selected target.
 */
export function resolveRasterDimensions(
  rendered: RenderedCode,
  requested?: number,
): RasterDimensions {
  const requestedSize = parseRasterPixelSize(requested ?? DEFAULT_RASTER_PIXEL_SIZE);

  if (isRenderedQrCode(rendered)) {
    const totalModules = rendered.metadata.totalModules;
    const modulePixels = Math.max(1, Math.floor(requestedSize / totalModules));
    const size = modulePixels * totalModules;
    return { width: size, height: size };
  }

  const naturalWidth = validateNaturalDimension(rendered.width, "width");
  const naturalHeight = validateNaturalDimension(rendered.height, "height");
  const longestSide = Math.max(naturalWidth, naturalHeight);

  if (longestSide <= requestedSize) {
    const integerScale = Math.max(1, Math.floor(requestedSize / longestSide));
    return {
      width: Math.max(1, Math.round(naturalWidth * integerScale)),
      height: Math.max(1, Math.round(naturalHeight * integerScale)),
    };
  }

  // Never downscale a barcode below its canonical SVG pixel grid. Shrinking
  // bars/modules introduces fractional sampling that can reduce scan reliability.
  return {
    width: Math.max(1, Math.round(naturalWidth)),
    height: Math.max(1, Math.round(naturalHeight)),
  };
}

/**
 * QR-only compatibility helper retained for code paths that still need one
 * square dimension. Barcode UI uses width/height-aware raster dimensions.
 */
export function resolveRasterPixelSize(rendered: RenderedCode, requested?: number): number {
  const dimensions = resolveRasterDimensions(rendered, requested);
  if (dimensions.width !== dimensions.height) {
    throw new Error("A single raster pixel size is available only for square artifacts.");
  }
  return dimensions.width;
}
