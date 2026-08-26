import encodeQR from "qr";

import { matrixToSvg } from "@/core/code/qr-matrix";
import {
  CodeRenderError,
  SAFE_QR_DEFAULTS,
  type CodeRenderer,
  type QrErrorCorrectionLevel,
  type QrMatrix,
  type RenderRequest,
  type RenderedCode,
} from "@/core/code/render";

const ENGINE_ECC: Record<QrErrorCorrectionLevel, "low" | "medium" | "quartile" | "high"> = {
  L: "low",
  M: "medium",
  Q: "quartile",
  H: "high",
};

function validateQuietZone(value: number): number {
  if (!Number.isInteger(value) || value < 4 || value > 16) {
    throw new CodeRenderError(
      "invalid-request",
      "Safe QR quiet zones must be an integer between 4 and 16 modules.",
    );
  }

  return value;
}

function normalizeMatrix(raw: readonly (readonly unknown[])[]): QrMatrix {
  if (raw.length === 0 || raw.some((row) => row.length !== raw.length)) {
    throw new CodeRenderError("engine", "The QR engine returned an invalid matrix.");
  }

  return raw.map((row) => row.map(Boolean));
}

function toRenderError(error: unknown): CodeRenderError {
  if (error instanceof CodeRenderError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("capacity") || lowerMessage.includes("too large")) {
    return new CodeRenderError(
      "capacity",
      "This payload is too dense for the selected QR error-correction level.",
    );
  }

  return new CodeRenderError("engine", "The QR engine could not render this payload.");
}

export class StandardQrRenderer implements CodeRenderer {
  readonly id = "standard-qr";

  supports(request: RenderRequest): boolean {
    return request.symbology === "qr";
  }

  async render(request: RenderRequest): Promise<RenderedCode> {
    if (!this.supports(request)) {
      throw new CodeRenderError("unsupported", `Renderer ${this.id} only supports QR.`);
    }

    if (!request.payload) {
      throw new CodeRenderError("invalid-request", "A non-empty payload is required.");
    }

    const errorCorrectionLevel =
      request.options?.errorCorrectionLevel ?? SAFE_QR_DEFAULTS.errorCorrectionLevel;
    const quietZoneModules = validateQuietZone(
      request.options?.quietZoneModules ?? SAFE_QR_DEFAULTS.quietZoneModules,
    );

    try {
      const raw = encodeQR(request.payload, "raw", {
        ecc: ENGINE_ECC[errorCorrectionLevel],
        encoding: "byte",
        border: quietZoneModules,
        scale: 1,
      });
      const matrix = normalizeMatrix(raw);
      const totalModules = matrix.length;
      const symbolModules = totalModules - quietZoneModules * 2;
      const version = (symbolModules - 17) / 4;

      if (!Number.isInteger(version) || version < 1 || version > 40) {
        throw new CodeRenderError("engine", "The QR engine returned an invalid symbol size.");
      }

      return {
        verificationMatrix: matrix,
        svg: matrixToSvg(matrix),
        metadata: {
          rendererId: this.id,
          symbology: "qr",
          errorCorrectionLevel,
          quietZoneModules,
          symbolModules,
          totalModules,
          version,
          payloadBytes: new TextEncoder().encode(request.payload).length,
        },
      };
    } catch (error) {
      throw toRenderError(error);
    }
  }
}

export const standardQrRenderer = new StandardQrRenderer();
