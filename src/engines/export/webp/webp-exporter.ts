import type { RenderedCode } from "@/core/code/render";
import type { ExportArtifact, Exporter, ExportRequest } from "@/core/export/export";
import { canvasToExactBlob, rasterizeRenderedSvg } from "@/engines/export/raster/rasterize-svg";
import { sanitizeFilenameBase } from "@/lib/files/filename";

const WEBP_QUALITY = 0.92;

export class WebpExporter implements Exporter {
  readonly format = "webp" as const;

  supports(rendered: RenderedCode): boolean {
    void rendered;
    return (
      typeof document !== "undefined" && typeof Image !== "undefined" && typeof URL !== "undefined"
    );
  }

  async export(request: ExportRequest): Promise<ExportArtifact> {
    if (!this.supports(request.rendered)) {
      throw new Error("WebP export requires a browser canvas environment.");
    }

    const { canvas, pixelSize } = await rasterizeRenderedSvg(request.rendered, request.pixelSize);
    const blob = await canvasToExactBlob(canvas, "image/webp", WEBP_QUALITY);
    const filenameBase = sanitizeFilenameBase(request.filenameBase);

    return {
      blob,
      filename: `${filenameBase}.webp`,
      mimeType: "image/webp",
      width: pixelSize,
      height: pixelSize,
    };
  }
}

export const webpExporter = new WebpExporter();
