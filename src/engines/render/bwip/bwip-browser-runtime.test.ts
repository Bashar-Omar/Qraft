import { describe, expect, it } from "vitest";

import { validateBwipSvg } from "@/engines/render/bwip/bwip-svg";
import { bwipBrowserRuntime } from "@/engines/render/bwip/bwip-browser-runtime";

describe("@bwip-js/browser runtime integration", () => {
  it("renders real linear SVGs through every allow-listed named encoder", () => {
    const cases = [
      ["code128", "code128", "QRAFT-128"],
      ["code39", "code39", "QRAFT-39"],
      ["code93", "code93", "QRAFT-93"],
      ["itf", "interleaved2of5", "0123456789"],
      ["itf14", "itf14", "09528765432108"],
      ["ean13", "ean13", "9520123456788"],
      ["ean8", "ean8", "01335583"],
      ["upca", "upca", "788581014974"],
      ["upce", "upce", "01234558"],
      ["codabar", "rationalizedCodabar", "A0123456789B"],
      ["code11", "code11", "01234-56789"],
      ["msi", "msi", "0123456789"],
      ["plessey", "plessey", "1A2B3C4D"],
    ] as const;

    for (const [symbology, bcid, text] of cases) {
      const svg = bwipBrowserRuntime.render(symbology, {
        bcid,
        text,
        binarytext: true,
        scale: 1,
        includetext: true,
        paddingwidth: 12,
        paddingheight: 0,
        backgroundcolor: "ffffff",
      });
      const artifact = validateBwipSvg(svg);

      expect(artifact.width).toBeGreaterThan(artifact.height);
      expect(artifact.svg).toContain("<path");
      expect(artifact.svg).not.toContain("<text");
    }
  });

  it("renders a real Data Matrix SVG through the named encoder", () => {
    const svg = bwipBrowserRuntime.render("datamatrix", {
      bcid: "datamatrix",
      text: "QRAFT-DM",
      binarytext: true,
      scale: 1,
      padding: 1,
      backgroundcolor: "ffffff",
    });
    const artifact = validateBwipSvg(svg);

    expect(artifact.width).toBeGreaterThan(0);
    expect(artifact.height).toBeGreaterThan(0);
    expect(artifact.svg).toContain('fill-rule="evenodd"');
  });

  it("renders real PDF417 and Aztec SVGs through named encoders", () => {
    const pdf = validateBwipSvg(
      bwipBrowserRuntime.render("pdf417", {
        bcid: "pdf417",
        text: "QRAFT-PDF417",
        binarytext: true,
        scale: 1,
        padding: 2,
        backgroundcolor: "ffffff",
      }),
    );
    expect(pdf.width).toBeGreaterThan(pdf.height);
    expect(pdf.svg).toContain("<path");

    const aztec = validateBwipSvg(
      bwipBrowserRuntime.render("aztec", {
        bcid: "azteccode",
        text: "QRAFT-AZTEC",
        binarytext: true,
        scale: 1,
        backgroundcolor: "ffffff",
      }),
    );
    expect(aztec.width).toBe(aztec.height);
    expect(aztec.svg).toContain("<path");
  });

  it("renders real Micro QR, MaxiCode and experimental rMQR SVGs through named encoders", () => {
    const micro = validateBwipSvg(
      bwipBrowserRuntime.render("microqr", {
        bcid: "microqrcode",
        text: "MICRO-QRAFT",
        binarytext: true,
        scale: 1,
        eclevel: "L",
        fixedeclevel: true,
        padding: 2,
        backgroundcolor: "ffffff",
      }),
    );
    expect(micro.width).toBe(micro.height);

    const maxi = validateBwipSvg(
      bwipBrowserRuntime.render("maxicode", {
        bcid: "maxicode",
        text: "Qraft parcel 2026",
        binarytext: true,
        scale: 1,
        backgroundcolor: "ffffff",
      }),
    );
    expect(maxi.width).toBeGreaterThan(0);
    expect(maxi.height).toBeGreaterThan(0);

    const rmqr = validateBwipSvg(
      bwipBrowserRuntime.render("rmqr", {
        bcid: "rectangularmicroqrcode",
        text: "Qraft narrow label",
        binarytext: true,
        scale: 1,
        version: "R17x139",
        eclevel: "M",
        fixedeclevel: true,
        padding: 2,
        backgroundcolor: "ffffff",
      }),
    );
    expect(rmqr.width).toBeGreaterThan(rmqr.height);
  });
});
