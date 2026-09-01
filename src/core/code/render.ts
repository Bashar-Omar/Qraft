import type { QraftQrDesign } from "@/core/design/qr-design";
import type { BarcodeSymbologyId, SymbologyId } from "@/core/code/symbology";

export type { BarcodeSymbologyId, SymbologyId } from "@/core/code/symbology";

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

export type QrRenderOptions = Readonly<{
  errorCorrectionLevel?: QrErrorCorrectionLevel;
  quietZoneModules?: number;
  design?: QraftQrDesign;
  logoAsset?: QrLogoRenderAsset;
}>;

/**
 * Phase 4A keeps barcode options intentionally Qraft-owned and minimal.
 * Format-specific fields are added only after their validation contracts exist.
 */
export type BarcodeRenderOptions = Readonly<{
  humanReadableText?: boolean;
}>;

export type QrRenderRequest = Readonly<{
  symbology: "qr";
  payload: string;
  options?: QrRenderOptions;
}>;

export type BarcodeRenderRequest = Readonly<{
  symbology: BarcodeSymbologyId;
  payload: string;
  options?: BarcodeRenderOptions;
}>;

export type RenderRequest = QrRenderRequest | BarcodeRenderRequest;

export type BaseRenderMetadata = Readonly<{
  rendererId: string;
  symbology: SymbologyId;
  payloadBytes: number;
}>;

export type QrRenderMetadata = BaseRenderMetadata &
  Readonly<{
    symbology: "qr";
    errorCorrectionLevel: QrErrorCorrectionLevel;
    quietZoneModules: number;
    symbolModules: number;
    totalModules: number;
    version: number;
  }>;

export type BarcodeQuietZoneModules = Readonly<{
  top: number;
  right: number;
  bottom: number;
  left: number;
}>;

export type BarcodeRenderMetadata = BaseRenderMetadata &
  Readonly<{
    symbology: BarcodeSymbologyId;
    humanReadableText: boolean;
    quietZoneModules: BarcodeQuietZoneModules;
  }>;

export type RenderMetadata = QrRenderMetadata | BarcodeRenderMetadata;

export type RenderedCodeBase<TMetadata extends RenderMetadata> = Readonly<{
  /** Natural dimensions from the canonical SVG viewBox/artifact. */
  width: number;
  height: number;
  /** Canonical vector artifact for preview and export. */
  svg: string;
  metadata: TMetadata;
}>;

export type RenderedQrCode = RenderedCodeBase<QrRenderMetadata> &
  Readonly<{
    /**
     * Logical matrix used as a standards-oriented verification reference.
     * Styled renderers may use a different mask while preserving the same
     * payload/version/ECC. Preview/export must use `svg`, not this matrix.
     */
    verificationMatrix: QrMatrix;
  }>;

export type RenderedBarcodeCode = RenderedCodeBase<BarcodeRenderMetadata>;
export type RenderedCode = RenderedQrCode | RenderedBarcodeCode;

export function isQrRenderRequest(request: RenderRequest): request is QrRenderRequest {
  return request.symbology === "qr";
}

export function isRenderedQrCode(rendered: RenderedCode): rendered is RenderedQrCode {
  return rendered.metadata.symbology === "qr";
}

export type RenderErrorCode = "unsupported" | "capacity" | "invalid-request" | "engine";

export class CodeRenderError extends Error {
  readonly code: RenderErrorCode;

  constructor(code: RenderErrorCode, message: string) {
    super(message);
    this.name = "CodeRenderError";
    this.code = code;
  }
}

export interface CodeRenderer<TOutput extends RenderedCode = RenderedCode> {
  readonly id: string;
  supports(request: RenderRequest): boolean;
  render(request: RenderRequest): Promise<TOutput>;
}
