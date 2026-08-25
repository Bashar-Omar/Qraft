import type { ExportArtifact, Exporter, ExportRequest } from "@/core/export/export";
import type { RenderedCode } from "@/core/code/render";
import { sanitizeFilenameBase } from "@/lib/files/filename";

export class SvgExporter implements Exporter {
  readonly format = "svg" as const;

  supports(rendered: RenderedCode): boolean {
    void rendered;
    return true;
  }

  async export(request: ExportRequest): Promise<ExportArtifact> {
    const filenameBase = sanitizeFilenameBase(request.filenameBase);

    return {
      blob: new Blob([request.rendered.svg], { type: "image/svg+xml;charset=utf-8" }),
      filename: `${filenameBase}.svg`,
      mimeType: "image/svg+xml",
    };
  }
}

export const svgExporter = new SvgExporter();
