import type { QraftQrDesign } from "@/core/design/qr-design";

export type SymbologyId = "qr";

export type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export const SAFE_QR_DEFAULTS = Object.freeze({
  errorCorrectionLevel: "M" as const,
  quietZoneModules: 4,
});

export type QrMatrix = readonly (readonly boolean[])[];

export const QR_ECC_APPROX_RECOVERY_FRACTION: Readonly<Record<QrErrorCorrectionLevel, number>> =
  Object.freeze({
    L: 0.07,
    M: 0.15,
    Q: 0.25,
    H: 0.3,
  });

export type QrLogoRenderAsset = Readonly<{
  /** Per-selection fingerprint used to invalidate stale renders without serializing image bytes. */
  id: string;
  /** Browser-local URL for the already-normalized square PNG. */
  uri: string;
  width: number;
  height: number;
}>;

export type RenderRequest = Readonly<{
  symbology: SymbologyId;
  payload: string;
  options?: Readonly<{
    errorCorrectionLevel?: QrErrorCorrectionLevel;
    quietZoneModules?: number;
    design?: QraftQrDesign;
    logoAsset?: QrLogoRenderAsset;
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
