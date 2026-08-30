import {
  CodeRenderError,
  type CodeRenderer,
  type RenderRequest,
  type RenderedBarcodeCode,
} from "@/core/code/render";
import { isBwipEncoderId } from "@/engines/render/bwip/bwip-contract";

export class LazyBwipBarcodeRenderer implements CodeRenderer<RenderedBarcodeCode> {
  readonly id = "bwip-lazy";

  supports(request: RenderRequest): boolean {
    return isBwipEncoderId(request.symbology);
  }

  async render(request: RenderRequest): Promise<RenderedBarcodeCode> {
    if (!this.supports(request)) {
      throw new CodeRenderError("unsupported", `Renderer ${this.id} does not support this symbology.`);
    }

    const { bwipBarcodeRenderer } = await import("@/engines/render/bwip/bwip-barcode-renderer");
    return bwipBarcodeRenderer.render(request);
  }
}

export const lazyBwipBarcodeRenderer = new LazyBwipBarcodeRenderer();
