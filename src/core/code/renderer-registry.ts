import {
  CodeRenderError,
  type CodeRenderer,
  type RenderRequest,
  type RenderedCode,
} from "@/core/code/render";

/**
 * Capability/adapter router. The application asks for a Qraft symbology and
 * never imports a vendor renderer directly.
 */
export class RendererRegistry<
  TOutput extends RenderedCode = RenderedCode,
> implements CodeRenderer<TOutput> {
  readonly id = "renderer-registry";

  constructor(private readonly renderers: readonly CodeRenderer<TOutput>[]) {}

  supports(request: RenderRequest): boolean {
    return this.renderers.some((renderer) => renderer.supports(request));
  }

  async render(request: RenderRequest): Promise<TOutput> {
    const renderer = this.renderers.find((candidate) => candidate.supports(request));

    if (!renderer) {
      throw new CodeRenderError(
        "unsupported",
        `No Qraft renderer is available for ${request.symbology}.`,
      );
    }

    return renderer.render(request);
  }
}
