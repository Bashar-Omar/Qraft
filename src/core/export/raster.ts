import type { RenderedCode } from "@/core/code/render";

export const RASTER_PIXEL_SIZES = [512, 1024, 2048, 4096] as const;
export type RasterPixelSize = (typeof RASTER_PIXEL_SIZES)[number];

export const DEFAULT_RASTER_PIXEL_SIZE: RasterPixelSize = 1024;

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

export function resolveRasterPixelSize(rendered: RenderedCode, requested?: number): number {
  const requestedSize = parseRasterPixelSize(requested ?? DEFAULT_RASTER_PIXEL_SIZE);
  const totalModules = rendered.metadata.totalModules;
  const modulePixels = Math.max(1, Math.floor(requestedSize / totalModules));
  return modulePixels * totalModules;
}
