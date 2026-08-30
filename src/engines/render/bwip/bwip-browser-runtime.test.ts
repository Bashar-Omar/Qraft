import { describe, expect, it } from "vitest";

import { validateBwipSvg } from "@/engines/render/bwip/bwip-svg";
import { bwipBrowserRuntime } from "@/engines/render/bwip/bwip-browser-runtime";

describe("@bwip-js/browser runtime integration", () => {
  it("renders a real rectangular Code 128 canonical SVG", () => {
    const svg = bwipBrowserRuntime.render("code128", {
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
    });
    const artifact = validateBwipSvg(svg);

    expect(artifact.width).toBeGreaterThan(artifact.height);
    expect(artifact.svg).toContain("<path");
    expect(artifact.svg).not.toContain("<text");
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
    expect(artifact.svg).toContain("fill-rule=\"evenodd\"");
  });
});
