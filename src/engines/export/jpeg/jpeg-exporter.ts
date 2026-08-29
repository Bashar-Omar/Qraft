import type { RenderedCode } from "@/core/code/render";
import type { ExportArtifact, Exporter, ExportRequest } from "@/core/export/export";
import { canvasToExactBlob, rasterizeRenderedSvg } from "@/engines/export/raster/rasterize-svg";
import { sanitizeFilenameBase } from "@/lib/files/filename";

const JPEG_QUALITY = 0.92;

export class JpegExporter implements Exporter {
  readonly format = "jpeg" as const;

  supports(rendered: RenderedCode): boolean {
    void rendered;
    return (
      typeof document !== "undefined" && typeof Image !== "undefined" && typeof URL !== "undefined"
    );
  }

  async export(request: ExportRequest): Promise<ExportArtifact> {
    if (!this.supports(request.rendered)) {
      throw new Error("JPEG export requires a browser canvas environment.");
    }

    const { canvas, pixelSize } = await rasterizeRenderedSvg(
      request.rendered,
      request.pixelSize,
      "#ffffff",
    );
    const blob = await canvasToExactBlob(canvas, "image/jpeg", JPEG_QUALITY);
    const filenameBase = sanitizeFilenameBase(request.filenameBase);

    return {
      blob,
      filename: `${filenameBase}.jpg`,
      mimeType: "image/jpeg",
      width: pixelSize,
      height: pixelSize,
    };
  }
}

export const jpegExporter = new JpegExporter();
