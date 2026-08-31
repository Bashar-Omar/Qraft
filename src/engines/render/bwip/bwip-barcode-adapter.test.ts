import { describe, expect, it } from "vitest";

import { BwipBarcodeAdapter } from "@/engines/render/bwip/bwip-barcode-adapter";
import type { BwipSvgOptions, BwipSvgRuntime } from "@/engines/render/bwip/bwip-contract";

function runtimeFixture() {
  const calls: Array<{ symbology: "code128" | "datamatrix"; options: BwipSvgOptions }> = [];
  const runtime: BwipSvgRuntime = {
    render(symbology, options) {
      calls.push({ symbology, options });
      return symbology === "code128"
        ? '<svg viewBox="0 0 132 50" xmlns="http://www.w3.org/2000/svg">\n<rect width="100%" height="100%" fill="#ffffff" />\n<path stroke="#000000" stroke-width="1" d="M10 1L10 40" />\n</svg>\n'
        : '<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">\n<rect width="100%" height="100%" fill="#ffffff" />\n<path d="M1 1L17 1L17 17Z" fill-rule="evenodd" />\n</svg>\n';
    },
  };

  return { runtime, calls };
}

describe("BWIP barcode adapter", () => {
  it("maps curated Code 128 into a narrow deterministic BWIP option surface", async () => {
    const { runtime, calls } = runtimeFixture();
    const renderer = new BwipBarcodeAdapter(runtime);

    const rendered = await renderer.render({ symbology: "code128", payload: "QRAFT-128" });

    expect(calls).toEqual([
      {
        symbology: "code128",
        options: {
          bcid: "code128",
          text: "QRAFT-128",
          binarytext: true,
          scale: 1,
          height: 15,
          includetext: true,
          textxalign: "center",
          paddingwidth: 10,
          paddingheight: 0,
          backgroundcolor: "ffffff",
        },
      },
    ]);
    expect(rendered).toMatchObject({
      width: 132,
      height: 50,
      metadata: {
        rendererId: "bwip",
        symbology: "code128",
        payloadBytes: 9,
        humanReadableText: true,
        quietZoneModules: { top: 0, right: 10, bottom: 0, left: 10 },
      },
    });
  });

  it("can intentionally suppress Code 128 human-readable text", async () => {
    const { runtime, calls } = runtimeFixture();
    const renderer = new BwipBarcodeAdapter(runtime);

    const rendered = await renderer.render({
      symbology: "code128",
      payload: "ABC123",
      options: { humanReadableText: false },
    });

    expect(calls[0]?.options.includetext).toBe(false);
    expect(calls[0]?.options.textxalign).toBeUndefined();
    expect(rendered.metadata.humanReadableText).toBe(false);
  });

  it("passes Data Matrix as exact eight-bit Latin-1 and preserves a one-module clear area", async () => {
    const { runtime, calls } = runtimeFixture();
    const renderer = new BwipBarcodeAdapter(runtime);

    const rendered = await renderer.render({ symbology: "datamatrix", payload: "Café" });

    expect(calls).toEqual([
      {
        symbology: "datamatrix",
        options: {
          bcid: "datamatrix",
          text: "Café",
          binarytext: true,
          scale: 1,
          padding: 1,
          backgroundcolor: "ffffff",
        },
      },
    ]);
    expect(calls[0]?.options.text.charCodeAt(3)).toBe(233);
    expect(rendered).toMatchObject({
      width: 18,
      height: 18,
      metadata: {
        symbology: "datamatrix",
        payloadBytes: 4,
        humanReadableText: false,
        quietZoneModules: { top: 1, right: 1, bottom: 1, left: 1 },
      },
    });
  });

  it("rejects unsupported presentation options before the vendor runtime", async () => {
    const { runtime, calls } = runtimeFixture();
    const renderer = new BwipBarcodeAdapter(runtime);

    await expect(
      renderer.render({
        symbology: "datamatrix",
        payload: "QRAFT",
        options: { humanReadableText: true },
      }),
    ).rejects.toMatchObject({ code: "invalid-request" });
    expect(calls).toHaveLength(0);
  });

  it("rejects unsafe vendor SVG before it reaches preview/export", async () => {
    const runtime: BwipSvgRuntime = {
      render: (symbology) =>
        symbology === "code128"
          ? '<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>'
          : '<svg viewBox="0 0 10 10"><path d="M0 0" /></svg>',
    };
    const renderer = new BwipBarcodeAdapter(runtime);

    await expect(renderer.render({ symbology: "code128", payload: "ABC" })).rejects.toMatchObject({
      code: "engine",
    });
  });

  it("maps known engine capacity failures to Qraft's typed failure model", async () => {
    const runtime: BwipSvgRuntime = {
      render: (symbology) => {
        if (symbology === "code128") {
          throw "too much data";
        }
        throw new Error("cannot fit data into barcode");
      },
    };
    const renderer = new BwipBarcodeAdapter(runtime);

    await expect(renderer.render({ symbology: "code128", payload: "ABC" })).rejects.toMatchObject({
      code: "capacity",
    });
  });
});
