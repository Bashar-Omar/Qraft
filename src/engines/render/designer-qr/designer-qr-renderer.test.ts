import { describe, expect, it, vi } from "vitest";

import type { CodeRenderer, QrRenderRequest, RenderedQrCode } from "@/core/code/render";
import { DEFAULT_QR_DESIGN } from "@/core/design/qr-design";
import {
  DesignerQrRenderer,
  toQrCodeStylingOptions,
} from "@/engines/render/designer-qr/designer-qr-renderer";

const request: QrRenderRequest = {
  symbology: "qr",
  payload: "https://example.com",
  options: {
    errorCorrectionLevel: "M",
    quietZoneModules: 4,
    design: DEFAULT_QR_DESIGN,
  },
};

const baseline: RenderedQrCode = {
  width: 29,
  height: 29,
  verificationMatrix: [[false]],
  svg: '<svg viewBox="0 0 1 1"/>',
  metadata: {
    rendererId: "standard-qr",
    symbology: "qr",
    errorCorrectionLevel: "M",
    quietZoneModules: 4,
    symbolModules: 21,
    totalModules: 29,
    version: 1,
    payloadBytes: 19,
  },
};

describe("DesignerQrRenderer", () => {
  it("maps Qraft design values to vendor options inside the adapter boundary", () => {
    const options = toQrCodeStylingOptions(request, baseline, {
      ...DEFAULT_QR_DESIGN,
      foreground: {
        kind: "linear-gradient",
        from: "#04120d",
        to: "#0b6b55",
        rotationDegrees: 90,
      },
      background: { kind: "transparent" },
      moduleShape: "rounded",
      eyeFrame: "extra-rounded",
      eyeDot: "dot",
    });

    expect(options.width).toBe(232);
    expect(options.margin).toBe(32);
    expect(options.qrOptions).toMatchObject({
      typeNumber: 1,
      mode: "Byte",
      errorCorrectionLevel: "M",
    });
    expect(options.dotsOptions?.type).toBe("rounded");
    expect(options.dotsOptions?.gradient?.rotation).toBeCloseTo(Math.PI / 2);
    expect(options.cornersSquareOptions?.type).toBe("extra-rounded");
    expect(options.cornersDotOptions?.type).toBe("dot");
    expect(options.backgroundOptions?.color).toBe("transparent");
  });

  it("fails clearly outside the browser without loading the vendor engine", async () => {
    const render = vi.fn(async () => baseline);
    const baselineRenderer: CodeRenderer<RenderedQrCode> = {
      id: "baseline",
      supports: () => true,
      render,
    };
    const renderer = new DesignerQrRenderer(baselineRenderer);

    await expect(renderer.render(request)).rejects.toMatchObject({
      code: "unsupported",
      message: "Designer QR rendering requires a browser environment.",
    });
    expect(render).not.toHaveBeenCalled();
  });

  it("translates portable logo geometry to vendor-only image options", () => {
    const logoDesign = {
      ...DEFAULT_QR_DESIGN,
      logo: { sizePercent: 20, paddingModules: 0.5 },
    } as const;
    const options = toQrCodeStylingOptions(
      {
        ...request,
        options: {
          ...request.options,
          design: logoDesign,
          logoAsset: {
            id: "logo-1",
            uri: "blob:https://qraft.local/logo-1",
            width: 256,
            height: 256,
          },
        },
      },
      baseline,
      logoDesign,
    );

    expect(options.image).toBe("blob:https://qraft.local/logo-1");
    expect(options.imageOptions?.hideBackgroundDots).toBe(true);
    expect(options.imageOptions?.imageSize).toBeCloseTo(0.04 / 0.15);
    expect(options.imageOptions?.margin).toBe(4);
    expect(options.imageOptions?.saveAsBlob).toBe(true);
  });
});
