import {
  CodeRenderError,
  type CodeRenderer,
  type RenderRequest,
  type RenderedCode,
} from "@/core/code/render";
import { DEFAULT_QR_DESIGN, isDefaultQrDesign, parseQrDesign } from "@/core/design/qr-design";
import { designerQrRenderer } from "@/engines/render/designer-qr/designer-qr-renderer";
import { standardQrRenderer } from "@/engines/render/standard-qr/standard-qr-renderer";

/**
 * Routes plain QR requests through the lightweight standards renderer and
 * loads the designer engine only after a visual design actually needs it.
 */
export class QrRenderer implements CodeRenderer {
  readonly id = "qr-router";

  constructor(
    private readonly standardRenderer: CodeRenderer = standardQrRenderer,
    private readonly designerRenderer: CodeRenderer = designerQrRenderer,
  ) {}

  supports(request: RenderRequest): boolean {
    return request.symbology === "qr";
  }

  async render(request: RenderRequest): Promise<RenderedCode> {
    if (!this.supports(request)) {
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
