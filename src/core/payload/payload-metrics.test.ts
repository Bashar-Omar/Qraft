import { describe, expect, it } from "vitest";

import { measurePayloadText } from "@/core/payload/payload-metrics";

describe("measurePayloadText", () => {
  it("counts UTF-8 bytes independently from Unicode code points", () => {
    const value = "A مرحبا 👋";
    const metrics = measurePayloadText(value);

    expect(metrics.codePoints).toBe(Array.from(value).length);
    expect(metrics.utf8Bytes).toBe(new TextEncoder().encode(value).byteLength);
    expect(metrics.utf8Bytes).toBeGreaterThan(metrics.codePoints);
  });

  it("counts mixed line endings and excludes normal whitespace controls", () => {
    expect(measurePayloadText("a\r\nb\nc\rd\t\u0001")).toMatchObject({
      lineBreaks: 3,
      nonWhitespaceControlCharacters: 1,
    });
  });
});
