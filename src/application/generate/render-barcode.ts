import { validateBarcodePayload } from "@/core/code/barcode-input";
import {
  CodeRenderError,
  type CodeRenderer,
  type RenderedBarcodeCode,
} from "@/core/code/render";
import type { SymbologyRegistry } from "@/core/code/symbology-registry";
import type { BarcodeSymbologyId, SymbologyDefinition } from "@/core/code/symbology";

export type RenderBarcodeInput = Readonly<{
  symbology: BarcodeSymbologyId;
  payload: unknown;
  humanReadableText?: boolean;
}>;

export type RenderBarcodeResult = Readonly<{
  symbology: SymbologyDefinition;
  payload: string;
  rendered: RenderedBarcodeCode;
}>;

export type RenderBarcodeDependencies = Readonly<{
  symbologies: Pick<SymbologyRegistry, "get">;
  renderer: CodeRenderer<RenderedBarcodeCode>;
}>;

/**
 * Application seam for barcode generation before Phase 4C exposes it in React.
 * Availability is intentionally a presentation/product-release concern here:
 * Step 2 can contract-test engine-backed planned definitions without calling them live.
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
      payload: validated.payload,
      options: {
        humanReadableText:
          input.humanReadableText ?? definition.capabilities.humanReadableText,
      },
    });

    return {
      symbology: definition,
      payload: validated.payload,
      rendered,
    };
  };
}
