import { describe, expect, it } from "vitest";

import { parseSvgViewBoxDimensions } from "@/core/code/svg-geometry";

describe("SVG geometry", () => {
  it("reads square and rectangular zero-origin viewBoxes", () => {
    expect(parseSvgViewBoxDimensions('<svg viewBox="0 0 29 29"/>')).toEqual({
      width: 29,
      height: 29,
    });
    expect(parseSvgViewBoxDimensions("<svg viewBox='0 0 242 100.5'></svg>")).toEqual({
      width: 242,
      height: 100.5,
    });
  });

  it("rejects missing or non-zero-origin geometry", () => {
    expect(() => parseSvgViewBoxDimensions("<svg></svg>")).toThrow(/viewBox/i);
    expect(() => parseSvgViewBoxDimensions('<svg viewBox="1 0 10 10"/>')).toThrow(/viewBox/i);
  });
});
