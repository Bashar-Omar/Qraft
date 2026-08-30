import { validateBarcodePayload, type ValidatedBarcodePayload } from "@/core/code/barcode-input";
import {
  CodeRenderError,
  type BarcodeRenderRequest,
  type BarcodeQuietZoneModules,
  type CodeRenderer,
  type RenderRequest,
  type RenderedBarcodeCode,
} from "@/core/code/render";
import type { BarcodeSymbologyId } from "@/core/code/symbology";
import {
  isBwipEncoderId,
  type BwipEncoderId,
  type BwipSvgOptions,
  type BwipSvgRuntime,
} from "@/engines/render/bwip/bwip-contract";
import { validateBwipSvg } from "@/engines/render/bwip/bwip-svg";

const CODE128_QUIET_ZONE_MODULES = Object.freeze({ top: 0, right: 10, bottom: 0, left: 10 });
const DATAMATRIX_QUIET_ZONE_MODULES = Object.freeze({ top: 1, right: 1, bottom: 1, left: 1 });

type BwipSymbologyProfile = Readonly<{
  encoder: BwipEncoderId;
  humanReadableText: Readonly<{
    supported: boolean;
    defaultValue: boolean;
  }>;
  quietZoneModules: BarcodeQuietZoneModules;
  createOptions(validated: ValidatedBarcodePayload, humanReadableText: boolean): BwipSvgOptions;
}>;

const BWIP_SYMBOLOGY_PROFILES: Readonly<Record<BwipEncoderId, BwipSymbologyProfile>> =
  Object.freeze({
    code128: {
      encoder: "code128",
      humanReadableText: { supported: true, defaultValue: true },
      quietZoneModules: CODE128_QUIET_ZONE_MODULES,
      createOptions(validated, humanReadableText) {
        return {
          bcid: "code128",
          text: validated.binaryText,
          binarytext: true,
          scale: 1,
          height: 15,
          includetext: humanReadableText,
          ...(humanReadableText ? { textxalign: "center" as const } : {}),
          paddingwidth: CODE128_QUIET_ZONE_MODULES.left,
          paddingheight: 0,
          backgroundcolor: "ffffff",
        };
      },
    },
    datamatrix: {
      encoder: "datamatrix",
      humanReadableText: { supported: false, defaultValue: false },
      quietZoneModules: DATAMATRIX_QUIET_ZONE_MODULES,
      createOptions(validated) {
        return {
          bcid: "datamatrix",
          text: validated.binaryText,
          binarytext: true,
          scale: 1,
          padding: DATAMATRIX_QUIET_ZONE_MODULES.left,
          backgroundcolor: "ffffff",
        };
      },
    },
  });

function isSupportedBarcodeRequest(
  request: RenderRequest,
): request is BarcodeRenderRequest & Readonly<{ symbology: BwipEncoderId }> {
  return isBwipEncoderId(request.symbology);
}

function mapEngineError(error: unknown, symbology: BarcodeSymbologyId): CodeRenderError {
  if (error instanceof CodeRenderError) {
    return error;
  }

  const detail = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const normalized = detail.toLowerCase();
  if (
    normalized.includes("too long") ||
    normalized.includes("too much data") ||
    normalized.includes("cannot fit")
  ) {
    return new CodeRenderError("capacity", `${symbology} content does not fit the selected symbol.`);
  }

  return new CodeRenderError("engine", `The ${symbology} engine could not render this content.`);
}

export class BwipBarcodeAdapter implements CodeRenderer<RenderedBarcodeCode> {
  readonly id = "bwip";

  constructor(private readonly runtime: BwipSvgRuntime) {}

  supports(request: RenderRequest): boolean {
    return isSupportedBarcodeRequest(request);
  }

  async render(request: RenderRequest): Promise<RenderedBarcodeCode> {
    if (!isSupportedBarcodeRequest(request)) {
      throw new CodeRenderError(
        "unsupported",
        `Renderer ${this.id} only supports the validated Phase 4B barcode slice.`,
      );
    }

    const profile = BWIP_SYMBOLOGY_PROFILES[request.symbology];
    const validated = validateBarcodePayload(request.symbology, request.payload);
    const requestedHumanReadableText = request.options?.humanReadableText;

    if (requestedHumanReadableText === true && !profile.humanReadableText.supported) {
      throw new CodeRenderError(
        "invalid-request",
        `${request.symbology} does not expose human-readable text through Qraft's barcode renderer.`,
      );
    }

    const humanReadableText =
      requestedHumanReadableText ?? profile.humanReadableText.defaultValue;

    try {
      const rawSvg = this.runtime.render(
        profile.encoder,
        profile.createOptions(validated, humanReadableText),
      );
      const artifact = validateBwipSvg(rawSvg);

      return {
        width: artifact.width,
        height: artifact.height,
        svg: artifact.svg,
        metadata: {
          rendererId: this.id,
          symbology: request.symbology,
          payloadBytes: validated.payloadBytes,
          humanReadableText,
          quietZoneModules: profile.quietZoneModules,
        },
      };
    } catch (error) {
      throw mapEngineError(error, request.symbology);
    }
  }
}
