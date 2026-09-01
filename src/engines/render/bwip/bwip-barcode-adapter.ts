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

const LINEAR_QUIET_ZONE_MODULES = Object.freeze({ top: 0, right: 10, bottom: 0, left: 10 });
const RETAIL_QUIET_ZONE_MODULES = Object.freeze({ top: 0, right: 12, bottom: 0, left: 12 });
const DATAMATRIX_QUIET_ZONE_MODULES = Object.freeze({ top: 1, right: 1, bottom: 1, left: 1 });

type BwipSymbologyProfile = Readonly<{
  encoder: BwipEncoderId;
  bcid: string;
  humanReadableText: Readonly<{
    supported: boolean;
    defaultValue: boolean;
  }>;
  quietZoneModules: BarcodeQuietZoneModules;
  createOptions(validated: ValidatedBarcodePayload, humanReadableText: boolean): BwipSvgOptions;
}>;

function createLinearProfile(
  encoder: BwipEncoderId,
  bcid: string,
  options: Readonly<{ nativeTextLayout?: boolean; retailGuardWhitespace?: boolean }> = {},
): BwipSymbologyProfile {
  const quietZoneModules = options.retailGuardWhitespace
    ? RETAIL_QUIET_ZONE_MODULES
    : LINEAR_QUIET_ZONE_MODULES;

  return {
    encoder,
    bcid,
    humanReadableText: { supported: true, defaultValue: true },
    quietZoneModules,
    createOptions(validated, humanReadableText) {
      return {
        bcid,
        text: validated.binaryText,
        binarytext: true,
        scale: 1,
        ...(!options.retailGuardWhitespace ? { height: 15 } : {}),
        includetext: humanReadableText,
        ...(humanReadableText && !options.nativeTextLayout
          ? { textxalign: "center" as const }
          : {}),
        paddingwidth: quietZoneModules.left,
        paddingheight: 0,
        ...(humanReadableText && options.retailGuardWhitespace ? { guardwhitespace: true } : {}),
        backgroundcolor: "ffffff",
      };
    },
  };
}

const BWIP_SYMBOLOGY_PROFILES: Readonly<Record<BwipEncoderId, BwipSymbologyProfile>> =
  Object.freeze({
    code128: createLinearProfile("code128", "code128"),
    code39: createLinearProfile("code39", "code39"),
    code93: createLinearProfile("code93", "code93"),
    itf: createLinearProfile("itf", "interleaved2of5"),
    itf14: createLinearProfile("itf14", "itf14", { nativeTextLayout: true }),
    ean13: createLinearProfile("ean13", "ean13", {
      nativeTextLayout: true,
      retailGuardWhitespace: true,
    }),
    ean8: createLinearProfile("ean8", "ean8", {
      nativeTextLayout: true,
      retailGuardWhitespace: true,
    }),
    upca: createLinearProfile("upca", "upca", {
      nativeTextLayout: true,
      retailGuardWhitespace: true,
    }),
    upce: createLinearProfile("upce", "upce", {
      nativeTextLayout: true,
      retailGuardWhitespace: true,
    }),
    datamatrix: {
      encoder: "datamatrix",
      bcid: "datamatrix",
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
    return new CodeRenderError(
      "capacity",
      `${symbology} content does not fit the selected symbol.`,
    );
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
        `Renderer ${this.id} only supports Qraft's validated BWIP barcode catalog.`,
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

    const humanReadableText = requestedHumanReadableText ?? profile.humanReadableText.defaultValue;

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
