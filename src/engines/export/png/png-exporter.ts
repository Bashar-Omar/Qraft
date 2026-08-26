import type { RenderedCode } from "@/core/code/render";
import type { ExportArtifact, Exporter, ExportRequest } from "@/core/export/export";
import { sanitizeFilenameBase } from "@/lib/files/filename";

const DEFAULT_PIXEL_SIZE = 1024;
const MIN_PIXEL_SIZE = 256;
const MAX_PIXEL_SIZE = 4096;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("The browser could not create a PNG blob."));
    }, "image/png");
  });
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const source = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(source);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The browser could not rasterize the generated SVG."));
    };
    image.src = url;
  });
}

export class PngExporter implements Exporter {
  readonly format = "png" as const;

  supports(rendered: RenderedCode): boolean {
    void rendered;
    return (
      typeof document !== "undefined" && typeof Image !== "undefined" && typeof URL !== "undefined"
    );
  }

  async export(request: ExportRequest): Promise<ExportArtifact> {
    if (!this.supports(request.rendered)) {
      throw new Error("PNG export requires a browser canvas environment.");
    }

    const requestedSize = Math.min(
      MAX_PIXEL_SIZE,
      Math.max(MIN_PIXEL_SIZE, Math.round(request.pixelSize ?? DEFAULT_PIXEL_SIZE)),
    );
    const totalModules = request.rendered.metadata.totalModules;
    const modulePixels = Math.max(1, Math.floor(requestedSize / totalModules));
    const actualSize = modulePixels * totalModules;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D is not available in this browser.");
    }

    canvas.width = actualSize;
    canvas.height = actualSize;
    context.clearRect(0, 0, actualSize, actualSize);

    const image = await loadSvgImage(request.rendered.svg);
    context.drawImage(image, 0, 0, actualSize, actualSize);

    const filenameBase = sanitizeFilenameBase(request.filenameBase);

    return {
      blob: await canvasToBlob(canvas),
      filename: `${filenameBase}.png`,
      mimeType: "image/png",
      width: actualSize,
      height: actualSize,
    };
  }
}

export const pngExporter = new PngExporter();
