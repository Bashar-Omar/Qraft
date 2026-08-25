import { describe, expect, it, vi } from "vitest";

import { createGenerateCode } from "@/application/generate/generate-code";
import type { CodeRenderer, RenderedCode } from "@/core/code/render";
import { payloadRegistry } from "@/core/payload/payload-registry";

const renderedFixture: RenderedCode = {
  matrix: [[false]],
  svg: '<svg viewBox="0 0 1 1"/>',
  metadata: {
    rendererId: "test-renderer",
    symbology: "qr",
    errorCorrectionLevel: "M",
    quietZoneModules: 4,
    symbolModules: 21,
    totalModules: 29,
    version: 1,
    payloadBytes: 19,
  },
};

describe("createGenerateCode", () => {
  it("keeps payload encoding separate from the renderer", async () => {
    const render = vi.fn(async () => renderedFixture);
    const renderer: CodeRenderer = {
      id: "test-renderer",
      supports: () => true,
      render,
    };
    const generateCode = createGenerateCode({
      payloads: payloadRegistry,
      renderer,
    });

    const result = await generateCode({
      payloadId: "url",
      input: "example.com",
    });

    expect(result.payload).toBe("https://example.com");
    expect(render).toHaveBeenCalledWith({
      symbology: "qr",
      payload: "https://example.com",
      options: {
        errorCorrectionLevel: "M",
        quietZoneModules: 4,
      },
    });
  });
});
