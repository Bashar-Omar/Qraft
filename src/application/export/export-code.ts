import type { RenderedCode } from "@/core/code/render";
import type { ExportArtifact, ExportFormat, Exporter } from "@/core/export/export";

export type ExporterRegistry = Readonly<Record<ExportFormat, Exporter>>;

export function createExportCode(exporters: ExporterRegistry) {
  return async function exportCode(
    rendered: RenderedCode,
    format: ExportFormat,
    filenameBase: string,
    options: Readonly<{ pixelSize?: number }> = {},
  ): Promise<ExportArtifact> {
    const exporter = exporters[format];

    if (!exporter.supports(rendered)) {
      throw new Error(`${format.toUpperCase()} export is not supported in this environment.`);
    }

    return exporter.export({
      rendered,
      filenameBase,
      pixelSize: options.pixelSize,
    });
  };
}
