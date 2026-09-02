import { validateBarcodePayload, type ValidatedBarcodePayload } from "@/core/code/barcode-input";
import { CodeRenderError, type CodeRenderer, type RenderedBarcodeCode } from "@/core/code/render";
import type { SymbologyRegistry } from "@/core/code/symbology-registry";
import type { BarcodeSymbologyId, SymbologyDefinition } from "@/core/code/symbology";

export type RenderBarcodeInput = Readonly<{
  symbology: BarcodeSymbologyId;
  payload: unknown;
  humanReadableText?: boolean;
}>;

export type RenderBarcodeResult = Readonly<{
  symbology: SymbologyDefinition;
  /** Canonical value actually encoded and expected from independent decode. */
  payload: string;
  validation: ValidatedBarcodePayload;
  rendered: RenderedBarcodeCode;
}>;

export type RenderBarcodeDependencies = Readonly<{
  symbologies: Pick<SymbologyRegistry, "get">;
  renderer: CodeRenderer<RenderedBarcodeCode>;
}>;

/**
 * Application seam for curated barcode generation. Product availability lives
 * in the symbology registry; rendering stays independent from React.
 */
export function createRenderBarcode({ symbologies, renderer }: RenderBarcodeDependencies) {
  return async function renderBarcode(input: RenderBarcodeInput): Promise<RenderBarcodeResult> {
    const definition = symbologies.get(input.symbology);
    const validated = validateBarcodePayload(input.symbology, input.payload);

    if (input.humanReadableText === true && !definition.capabilities.humanReadableText) {
      throw new CodeRenderError(
        "invalid-request",
        `${definition.label} does not support human-readable text in Qraft.`,
      );
    }

    const rendered = await renderer.render({
      symbology: input.symbology,
      payload: validated.encodedPayload,
      options: {
        humanReadableText: input.humanReadableText ?? definition.capabilities.humanReadableText,
      },
    });

    return {
      symbology: definition,
      payload: validated.encodedPayload,
      validation: validated,
      rendered,
    };
  };
}
