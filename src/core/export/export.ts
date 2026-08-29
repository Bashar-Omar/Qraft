import type { RenderedCode } from "@/core/code/render";

export type ExportFormat = "svg" | "png" | "jpeg" | "webp";

export type ExportRequest = Readonly<{
  rendered: RenderedCode;
  filenameBase: string;
  pixelSize?: number;
}>;

export type ExportArtifact = Readonly<{
  blob: Blob;
  filename: string;
  mimeType: string;
  width?: number;
  height?: number;
}>;

export interface Exporter {
  readonly format: ExportFormat;
  supports(rendered: RenderedCode): boolean;
  export(request: ExportRequest): Promise<ExportArtifact>;
}
