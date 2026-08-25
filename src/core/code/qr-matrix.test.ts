import { describe, expect, it } from "vitest";

import { matrixToPathData, matrixToSvg } from "@/core/code/qr-matrix";

describe("QR matrix rendering", () => {
  const matrix = [
    [true, true, false],
    [false, true, false],
    [true, false, true],
  ] as const;

  it("coalesces horizontal runs into path commands", () => {
    expect(matrixToPathData(matrix)).toBe("M0 0h2v1H0zM1 1h1v1H1zM0 2h1v1H0zM2 2h1v1H2z");
  });

  it("creates a self-contained black-on-white SVG", () => {
    const svg = matrixToSvg(matrix);

    expect(svg).toContain('viewBox="0 0 3 3"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#000000"');
  });
});
