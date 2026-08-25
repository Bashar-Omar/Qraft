import { describe, expect, it } from "vitest";

import { PayloadValidationError } from "@/core/payload/payload";
import { urlCodec } from "@/core/payload/codecs/url.codec";

describe("urlCodec", () => {
  it("preserves an explicit https URL", () => {
    const data = urlCodec.parseInput("https://example.com/path?q=1");

    expect(data).toEqual({
      url: "https://example.com/path?q=1",
      normalizedFromMissingScheme: false,
    });
    expect(urlCodec.encode(data)).toBe("https://example.com/path?q=1");
  });

  it("adds https when the scheme is missing", () => {
    const data = urlCodec.parseInput("example.com/docs");

    expect(data.url).toBe("https://example.com/docs");
    expect(data.normalizedFromMissingScheme).toBe(true);
  });

  it("rejects dangerous or non-curated protocols", () => {
    expect(() => urlCodec.parseInput("javascript:alert(1)")).toThrow(PayloadValidationError);
    expect(() => urlCodec.parseInput("ftp://example.com/file")).toThrow(PayloadValidationError);
  });

  it("rejects empty input", () => {
    expect(() => urlCodec.parseInput("   ")).toThrow(PayloadValidationError);
  });
});
