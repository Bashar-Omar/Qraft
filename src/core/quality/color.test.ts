import { describe, expect, it } from "vitest";

import { contrastRatio, relativeLuminance, sampleForegroundColors } from "@/core/quality/color";

describe("QR quality color helpers", () => {
  it("uses the sRGB relative-luminance formula", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
  });

  it("samples a linear gradient across multiple regions", () => {
    const samples = sampleForegroundColors({
      kind: "linear-gradient",
      from: "#000000",
      to: "#ffffff",
      rotationDegrees: 45,
    });

    expect(samples).toHaveLength(5);
    expect(samples[0]).toBe("#000000");
    expect(samples[2]).toBe("#808080");
    expect(samples[4]).toBe("#ffffff");
  });
});
