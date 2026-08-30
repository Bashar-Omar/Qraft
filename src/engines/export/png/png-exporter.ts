import type { RenderedCode } from "@/core/code/render";
import type { ExportArtifact, Exporter, ExportRequest } from "@/core/export/export";
import { canvasToExactBlob, rasterizeRenderedSvg } from "@/engines/export/raster/rasterize-svg";
import { sanitizeFilenameBase } from "@/lib/files/filename";

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

    const { canvas, pixelWidth, pixelHeight } = await rasterizeRenderedSvg(
      request.rendered,
      request.pixelSize,
    );
    const filenameBase = sanitizeFilenameBase(request.filenameBase);

    return {
      blob: await canvasToExactBlob(canvas, "image/png"),
      filename: `${filenameBase}.png`,
      mimeType: "image/png",
      width: pixelWidth,
      height: pixelHeight,
    };
  }
}

export const pngExporter = new PngExporter();
