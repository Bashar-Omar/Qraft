import { describe, expect, it } from "vitest";

import { BwipBarcodeAdapter } from "@/engines/render/bwip/bwip-barcode-adapter";
import type {
  BwipEncoderId,
  BwipSvgOptions,
  BwipSvgRuntime,
} from "@/engines/render/bwip/bwip-contract";

function runtimeFixture() {
  const calls: Array<{ symbology: BwipEncoderId; options: BwipSvgOptions }> = [];
  const runtime: BwipSvgRuntime = {
    render(symbology, options) {
      calls.push({ symbology, options });
      return symbology === "datamatrix" || symbology === "aztec"
        ? '<svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">\n<rect width="100%" height="100%" fill="#ffffff" />\n<path d="M1 1L17 1L17 17Z" fill-rule="evenodd" />\n</svg>\n'
        : '<svg viewBox="0 0 132 50" xmlns="http://www.w3.org/2000/svg">\n<rect width="100%" height="100%" fill="#ffffff" />\n<path stroke="#000000" stroke-width="1" d="M10 1L10 40" />\n</svg>\n';
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

  it("maps the curated linear family to named BWIP encoders without leaking vendor IDs", async () => {
    const cases = [
      ["code39", "QRAFT-39", "code39"],
      ["code93", "QRAFT-93", "code93"],
      ["itf", "0123456789", "interleaved2of5"],
      ["itf14", "09528765432108", "itf14"],
    ] as const;

    for (const [symbology, payload, bcid] of cases) {
      const { runtime, calls } = runtimeFixture();
      const renderer = new BwipBarcodeAdapter(runtime);
      const rendered = await renderer.render({ symbology, payload });

      expect(calls[0]).toMatchObject({
        symbology,
        options: { bcid, text: payload, includetext: true, paddingwidth: 10 },
      });
      expect(rendered.metadata).toMatchObject({ symbology, humanReadableText: true });
    }
  });

  it("passes canonical retail digits to EAN/UPC and preserves their native text layout", async () => {
    const cases = [
      ["ean13", "952012345678", "9520123456788", "ean13"],
      ["ean8", "0133558", "01335583", "ean8"],
      ["upca", "78858101497", "788581014974", "upca"],
      ["upce", "0123455", "01234558", "upce"],
    ] as const;

    for (const [symbology, payload, canonical, bcid] of cases) {
      const { runtime, calls } = runtimeFixture();
      const renderer = new BwipBarcodeAdapter(runtime);
      const rendered = await renderer.render({ symbology, payload });

      expect(calls[0]).toMatchObject({
        symbology,
        options: {
          bcid,
          text: canonical,
          includetext: true,
          guardwhitespace: true,
          paddingwidth: 12,
        },
      });
      expect(calls[0]?.options.textxalign).toBeUndefined();
      expect(rendered.metadata.quietZoneModules).toEqual({
        top: 0,
        right: 12,
        bottom: 0,
        left: 12,
      });
    }
  });

  it("can intentionally suppress human-readable text on linear and retail formats", async () => {
    const { runtime, calls } = runtimeFixture();
    const renderer = new BwipBarcodeAdapter(runtime);

    const rendered = await renderer.render({
      symbology: "code39",
      payload: "ABC123",
      options: { humanReadableText: false },
    });

    expect(calls[0]?.options.includetext).toBe(false);
    expect(calls[0]?.options.textxalign).toBeUndefined();
    expect(rendered.metadata.humanReadableText).toBe(false);

    calls.length = 0;
    await renderer.render({
      symbology: "ean13",
      payload: "952012345678",
      options: { humanReadableText: false },
    });
    expect(calls[0]?.options.includetext).toBe(false);
    expect(calls[0]?.options.guardwhitespace).toBeUndefined();
    expect(calls[0]?.options.paddingwidth).toBe(12);
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

  it("maps PDF417 and Aztec through curated Latin-1 2D profiles with standards-aware clear areas", async () => {
    const { runtime, calls } = runtimeFixture();
    const renderer = new BwipBarcodeAdapter(runtime);

    const pdf = await renderer.render({ symbology: "pdf417", payload: "Document Ä-42" });
    expect(calls[0]).toEqual({
      symbology: "pdf417",
      options: {
        bcid: "pdf417",
        text: "Document Ä-42",
        binarytext: true,
        scale: 1,
        padding: 2,
        backgroundcolor: "ffffff",
      },
    });
    expect(pdf.metadata).toMatchObject({
      symbology: "pdf417",
      humanReadableText: false,
      quietZoneModules: { top: 2, right: 2, bottom: 2, left: 2 },
    });

    calls.length = 0;
    const aztec = await renderer.render({ symbology: "aztec", payload: "Ticket Café" });
    expect(calls[0]).toEqual({
      symbology: "aztec",
      options: {
        bcid: "azteccode",
        text: "Ticket Café",
        binarytext: true,
        scale: 1,
        backgroundcolor: "ffffff",
      },
    });
    expect(aztec.metadata).toMatchObject({
      symbology: "aztec",
      humanReadableText: false,
      quietZoneModules: { top: 0, right: 0, bottom: 0, left: 0 },
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
