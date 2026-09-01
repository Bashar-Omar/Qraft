import {
  CodeRenderError,
  type CodeRenderer,
  type RenderRequest,
  type RenderedQrCode,
} from "@/core/code/render";
import { DEFAULT_QR_DESIGN, isDefaultQrDesign, parseQrDesign } from "@/core/design/qr-design";
import { designerQrRenderer } from "@/engines/render/designer-qr/designer-qr-renderer";
import { standardQrRenderer } from "@/engines/render/standard-qr/standard-qr-renderer";

/**
 * Routes plain QR requests through the lightweight standards renderer and
 * loads the designer engine only after a visual design actually needs it.
 */
export class QrRenderer implements CodeRenderer<RenderedQrCode> {
  readonly id = "qr-router";

  constructor(
    private readonly standardRenderer: CodeRenderer<RenderedQrCode> = standardQrRenderer,
    private readonly designerRenderer: CodeRenderer<RenderedQrCode> = designerQrRenderer,
  ) {}

  supports(request: RenderRequest): boolean {
    return request.symbology === "qr";
  }

  async render(request: RenderRequest): Promise<RenderedQrCode> {
    if (request.symbology !== "qr") {
      throw new CodeRenderError("unsupported", `Renderer ${this.id} only supports QR.`);
    }

    const design = parseQrDesign(request.options?.design ?? DEFAULT_QR_DESIGN);

    if (isDefaultQrDesign(design)) {
      return this.standardRenderer.render({
        ...request,
        options: {
          ...request.options,
          quietZoneModules: design.quietZoneModules,
          design: undefined,
          logoAsset: undefined,
        },
      });
    }

    return this.designerRenderer.render({
      ...request,
      options: {
        ...request.options,
        quietZoneModules: design.quietZoneModules,
        design,
      },
    });
  }
}

export const qrRenderer = new QrRenderer();
