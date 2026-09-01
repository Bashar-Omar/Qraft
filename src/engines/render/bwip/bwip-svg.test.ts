import { describe, expect, it } from "vitest";

import { CodeRenderError } from "@/core/code/render";
import { validateBwipSvg } from "@/engines/render/bwip/bwip-svg";

const SAFE_FIXTURE = `<svg viewBox="0 0 132 50" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="clip0"><path d="M0 0L10 0L10 10Z" /></clipPath></defs>
<rect width="100%" height="100%" fill="#ffffff" />
<path stroke="#000000" stroke-width="1" d="M10 0L10 40" />
<path d="M20 0L30 0L30 40Z" fill-rule="evenodd" clip-path="url(#clip0)" />
</svg>`;

describe("BWIP SVG boundary", () => {
  it("accepts the narrow path/rect/local-clip structure emitted by drawingSVG", () => {
    expect(validateBwipSvg(SAFE_FIXTURE)).toEqual({
      svg: SAFE_FIXTURE,
      width: 132,
      height: 50,
    });
  });

  it.each([
    '<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>',
    '<svg viewBox="0 0 10 10"><image href="https://example.com/a.png" /></svg>',
    '<svg viewBox="0 0 10 10"><path onclick="alert(1)" d="M0 0" /></svg>',
    '<svg viewBox="0 0 10 10"><path style="fill:red" d="M0 0" /></svg>',
    '<svg viewBox="0 0 10 10"><path clip-path="url(https://example.com/#x)" d="M0 0" /></svg>',
  ])("rejects markup outside the vendor allow-list", (svg) => {
    expect(() => validateBwipSvg(svg)).toThrowError(CodeRenderError);
  });

  it("rejects malformed or non-zero-origin SVG geometry", () => {
    expect(() => validateBwipSvg('<svg viewBox="1 1 10 10"><path d="M0 0" /></svg>')).toThrow(
      /geometry/i,
    );
  });
});
