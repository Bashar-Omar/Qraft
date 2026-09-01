import { describe, expect, it } from "vitest";

import { validateBwipSvg } from "@/engines/render/bwip/bwip-svg";
import { bwipBrowserRuntime } from "@/engines/render/bwip/bwip-browser-runtime";

describe("@bwip-js/browser runtime integration", () => {
  it("renders real linear SVGs through every curated named encoder", () => {
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
});
