import type { QraftQrDesign } from "@/core/design/qr-design";

export type SymbologyId = "qr";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export const SAFE_QR_DEFAULTS = Object.freeze({
  errorCorrectionLevel: "M" as const,
  quietZoneModules: 4,
});

export type QrMatrix = readonly (readonly boolean[])[];

export type RenderRequest = Readonly<{
  symbology: SymbologyId;
  payload: string;
  options?: Readonly<{
    errorCorrectionLevel?: QrErrorCorrectionLevel;
    quietZoneModules?: number;
    design?: QraftQrDesign;
  }>;
}>;

export type RenderMetadata = Readonly<{
  rendererId: string;
  symbology: SymbologyId;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  quietZoneModules: number;
  symbolModules: number;
  totalModules: number;
  version: number;
  payloadBytes: number;
}>;

export type RenderedCode = Readonly<{
  /**
   * Logical matrix used as a standards-oriented verification reference.
   * Styled renderers may use a different mask while preserving the same
   * payload/version/ECC. Preview/export must use `svg`, not this matrix.
   */
  verificationMatrix: QrMatrix;
  /** Canonical vector artifact for preview and export. */
  svg: string;
  metadata: RenderMetadata;
}>;

export type RenderErrorCode = "unsupported" | "capacity" | "invalid-request" | "engine";

export class CodeRenderError extends Error {
  readonly code: RenderErrorCode;

  constructor(code: RenderErrorCode, message: string) {
    super(message);
    this.name = "CodeRenderError";
    this.code = code;
  }
}

export interface CodeRenderer {
  readonly id: string;
  supports(request: RenderRequest): boolean;
  render(request: RenderRequest): Promise<RenderedCode>;
}
