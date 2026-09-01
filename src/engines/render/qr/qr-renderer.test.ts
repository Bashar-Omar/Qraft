import { describe, expect, it, vi } from "vitest";

import type { CodeRenderer, RenderRequest, RenderedQrCode } from "@/core/code/render";
import { DEFAULT_QR_DESIGN } from "@/core/design/qr-design";
import { QrRenderer } from "@/engines/render/qr/qr-renderer";

function rendered(rendererId: string): RenderedQrCode {
  return {
    width: 29,
    height: 29,
    verificationMatrix: [[false]],
    svg: '<svg viewBox="0 0 1 1"/>',
    metadata: {
      rendererId,
      symbology: "qr",
      errorCorrectionLevel: "M",
      quietZoneModules: 4,
      symbolModules: 21,
      totalModules: 29,
      version: 1,
      payloadBytes: 19,
    },
  };
}

const request: RenderRequest = {
  symbology: "qr",
  payload: "https://example.com",
  options: {
    errorCorrectionLevel: "M",
    quietZoneModules: 4,
    design: DEFAULT_QR_DESIGN,
  },
};

describe("QrRenderer", () => {
  it("keeps the default design on the lightweight standard renderer", async () => {
    const standardRender = vi.fn(async () => rendered("standard-qr"));
    const designerRender = vi.fn(async () => rendered("designer-qr"));
    const renderer = new QrRenderer(
      {
        id: "standard",
        supports: () => true,
        render: standardRender,
      } satisfies CodeRenderer<RenderedQrCode>,
      {
        id: "designer",
        supports: () => true,
        render: designerRender,
      } satisfies CodeRenderer<RenderedQrCode>,
    );

    const result = await renderer.render(request);

    expect(result.metadata.rendererId).toBe("standard-qr");
    expect(standardRender).toHaveBeenCalledOnce();
    expect(designerRender).not.toHaveBeenCalled();
  });

  it("routes visual customization to the designer adapter", async () => {
    const standardRender = vi.fn(async () => rendered("standard-qr"));
    const designerRender = vi.fn(async () => rendered("designer-qr"));
    const renderer = new QrRenderer(
      {
        id: "standard",
        supports: () => true,
        render: standardRender,
      } satisfies CodeRenderer<RenderedQrCode>,
      {
        id: "designer",
        supports: () => true,
        render: designerRender,
      } satisfies CodeRenderer<RenderedQrCode>,
    );

    const result = await renderer.render({
      ...request,
      options: {
        ...request.options,
        design: {
          ...DEFAULT_QR_DESIGN,
          moduleShape: "rounded",
        },
      },
    });

    expect(result.metadata.rendererId).toBe("designer-qr");
    expect(designerRender).toHaveBeenCalledOnce();
    expect(standardRender).not.toHaveBeenCalled();
  });

  it("routes a logo-bearing standard visual design through the designer adapter", async () => {
    const standardRender = vi.fn(async () => rendered("standard-qr"));
    const designerRender = vi.fn(async () => rendered("designer-qr"));
    const renderer = new QrRenderer(
      {
        id: "standard",
        supports: () => true,
        render: standardRender,
      } satisfies CodeRenderer<RenderedQrCode>,
      {
        id: "designer",
        supports: () => true,
        render: designerRender,
      } satisfies CodeRenderer<RenderedQrCode>,
    );

    const result = await renderer.render({
      ...request,
      options: {
        ...request.options,
        design: {
          ...DEFAULT_QR_DESIGN,
          logo: { sizePercent: 20, paddingModules: 0.5 },
        },
        logoAsset: { id: "logo-1", uri: "blob:qraft-logo", width: 256, height: 256 },
      },
    });

    expect(result.metadata.rendererId).toBe("designer-qr");
    expect(designerRender).toHaveBeenCalledOnce();
    expect(standardRender).not.toHaveBeenCalled();
  });
});
