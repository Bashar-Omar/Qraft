import type { Options, TypeNumber } from "qr-code-styling";

import {
  CodeRenderError,
  QR_ECC_APPROX_RECOVERY_FRACTION,
  type CodeRenderer,
  type RenderRequest,
  type RenderedCode,
} from "@/core/code/render";
import {
  DEFAULT_QR_DESIGN,
  parseQrDesign,
  type QrForegroundPaint,
  type QraftQrDesign,
} from "@/core/design/qr-design";
import { standardQrRenderer } from "@/engines/render/standard-qr/standard-qr-renderer";

const MODULE_PIXELS = 8;

function paintOptions(paint: QrForegroundPaint): Readonly<{
  color?: string;
  gradient?: NonNullable<Options["dotsOptions"]>["gradient"];
}> {
  if (paint.kind === "solid") {
    return { color: paint.color };
  }

  return {
    gradient: {
      type: "linear",
      rotation: (paint.rotationDegrees * Math.PI) / 180,
      colorStops: [
        { offset: 0, color: paint.from },
        { offset: 1, color: paint.to },
      ],
    },
  };
}

function toVendorLogoImageSize(design: QraftQrDesign, baseline: RenderedCode): number | undefined {
  if (!design.logo) {
    return undefined;
  }

  const areaSideRatio = design.logo.sizePercent / 100;
  const coverageFraction = areaSideRatio * areaSideRatio;
  const recoveryFraction = QR_ECC_APPROX_RECOVERY_FRACTION[baseline.metadata.errorCorrectionLevel];

  // qr-code-styling expresses its image budget as a coefficient of the
  // selected ECC recovery fraction. Qraft stores a portable visual area
  // percentage instead and translates only inside this adapter.
  return Math.min(1, coverageFraction / recoveryFraction);
}

export function toQrCodeStylingOptions(
  request: RenderRequest,
  baseline: RenderedCode,
  designInput: QraftQrDesign = DEFAULT_QR_DESIGN,
): Options {
  const design = parseQrDesign(designInput);
  const foreground = paintOptions(design.foreground);
  const size = baseline.metadata.totalModules * MODULE_PIXELS;
  const margin = design.quietZoneModules * MODULE_PIXELS;
  const logoAsset = request.options?.logoAsset;
  const logoImageSize = toVendorLogoImageSize(design, baseline);

  return {
    type: "svg",
    width: size,
    height: size,
    margin,
    data: request.payload,
    qrOptions: {
      typeNumber: baseline.metadata.version as TypeNumber,
      mode: "Byte",
      errorCorrectionLevel: baseline.metadata.errorCorrectionLevel,
    },
    ...(design.logo && logoAsset && logoImageSize !== undefined
      ? {
          image: logoAsset.uri,
          imageOptions: {
            hideBackgroundDots: true,
            imageSize: logoImageSize,
            margin: design.logo.paddingModules * MODULE_PIXELS,
            saveAsBlob: true,
          },
        }
      : {}),
    dotsOptions: {
      ...foreground,
      type: design.moduleShape,
      roundSize: false,
    },
    cornersSquareOptions: {
      ...foreground,
      type: design.eyeFrame,
    },
    cornersDotOptions: {
      ...foreground,
      type: design.eyeDot,
    },
    backgroundOptions: {
      color: design.background.kind === "transparent" ? "transparent" : design.background.color,
    },
  };
}

function assertSafeVendorSvg(svg: string, expectsEmbeddedLogo: boolean): string {
  const trimmed = svg.trim();
  const lower = trimmed.toLowerCase();

  if (!lower.includes("<svg")) {
    throw new CodeRenderError("engine", "The designer QR engine did not return SVG output.");
  }

  if (lower.includes("<script") || lower.includes("javascript:") || /\son[a-z]+\s*=/.test(lower)) {
    throw new CodeRenderError("engine", "The designer QR engine returned unsafe SVG output.");
  }

  if (expectsEmbeddedLogo) {
    const imageReferences = Array.from(
      trimmed.matchAll(/<image\b[^>]*(?:href|xlink:href)\s*=\s*["']([^"']+)["'][^>]*>/gi),
      (match) => match[1],
    );

    if (imageReferences.length === 0) {
      throw new CodeRenderError("engine", "The designer QR engine omitted the selected logo.");
    }

    if (imageReferences.some((reference) => !/^data:image\/png;base64,/i.test(reference))) {
      throw new CodeRenderError(
        "engine",
        "The designer QR engine did not embed the logo as a self-contained PNG.",
      );
    }
  }

  return trimmed;
}

function toDesignerError(error: unknown): CodeRenderError {
  if (error instanceof CodeRenderError) {
    return error;
  }

  return new CodeRenderError("engine", "The designer QR engine could not render this payload.");
}

export class DesignerQrRenderer implements CodeRenderer {
  readonly id = "designer-qr";

  constructor(private readonly baselineRenderer: CodeRenderer = standardQrRenderer) {}

  supports(request: RenderRequest): boolean {
    return request.symbology === "qr";
  }

  async render(request: RenderRequest): Promise<RenderedCode> {
    if (!this.supports(request)) {
      throw new CodeRenderError("unsupported", `Renderer ${this.id} only supports QR.`);
    }

    if (typeof window === "undefined" || typeof Blob === "undefined") {
      throw new CodeRenderError(
        "unsupported",
        "Designer QR rendering requires a browser environment.",
      );
    }

    const design = parseQrDesign(request.options?.design ?? DEFAULT_QR_DESIGN);
    const logoAsset = request.options?.logoAsset;

    if (design.logo && !logoAsset) {
      throw new CodeRenderError(
        "invalid-request",
        "A logo design requires a prepared local logo asset.",
      );
    }

    if (logoAsset && (logoAsset.width !== logoAsset.height || logoAsset.width < 1)) {
      throw new CodeRenderError(
        "invalid-request",
        "QR logo assets must be normalized square images.",
      );
    }

    try {
      const baseline = await this.baselineRenderer.render({
        ...request,
        options: {
          ...request.options,
          quietZoneModules: design.quietZoneModules,
          design: undefined,
          logoAsset: undefined,
        },
      });
      const { default: QRCodeStyling } = await import("qr-code-styling");
      const styledQr = new QRCodeStyling(toQrCodeStylingOptions(request, baseline, design));
      const raw = await styledQr.getRawData("svg");

      if (!(raw instanceof Blob)) {
        throw new CodeRenderError(
          "engine",
          "The browser designer QR engine returned an unexpected artifact type.",
        );
      }

      const svg = assertSafeVendorSvg(await raw.text(), Boolean(design.logo));

      return {
        verificationMatrix: baseline.verificationMatrix,
        svg,
        metadata: {
          ...baseline.metadata,
          rendererId: this.id,
        },
      };
    } catch (error) {
      throw toDesignerError(error);
    }
  }
}

export const designerQrRenderer = new DesignerQrRenderer();
