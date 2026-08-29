import { describe, expect, it } from "vitest";

import { QR_V40_BYTE_CAPACITY } from "@/core/code/qr-capacity";
import { measureRawPayload, rawCodec } from "@/core/payload/codecs/raw.codec";
import { PayloadValidationError } from "@/core/payload/payload";

describe("rawCodec", () => {
  it("preserves leading/trailing whitespace, Unicode and line endings exactly", () => {
    const value = "  Qraft RAW\r\nمرحبا 👋\n  ";
    const data = rawCodec.parseInput({ value });

    expect(rawCodec.encode(data)).toBe(value);
    expect(rawCodec.inspect(value)).toEqual({
      id: "raw",
      data: { value },
    });
  });

  it("accepts whitespace-only content because Raw mode does not trim", () => {
    const value = " \t\r\n ";

    expect(rawCodec.encode(rawCodec.parseInput({ value }))).toBe(value);
  });

  it("rejects only a truly empty raw payload", () => {
    expect(() => rawCodec.parseInput({ value: "" })).toThrow(PayloadValidationError);
    expect(rawCodec.inspect("")).toBeNull();
  });

  it("measures UTF-8 bytes separately from Unicode code points", () => {
    expect(measureRawPayload("A€👋")).toMatchObject({
      utf8Bytes: 8,
      codePoints: 3,
    });
  });

  it("reports line breaks and non-whitespace control characters transparently", () => {
    expect(measureRawPayload("a\nb\r\nc\t\u0001\u007f")).toMatchObject({
      lineBreaks: 2,
      nonWhitespaceControlCharacters: 2,
    });
  });

  it("rejects payloads that cannot fit Qraft's current byte-mode QR pipeline at any ECC", () => {
    const value = "x".repeat(QR_V40_BYTE_CAPACITY.L + 1);

    expect(() => rawCodec.parseInput({ value })).toThrow(/byte mode/i);
  });

  it("accepts the absolute Version 40-L byte-mode boundary", () => {
    const value = "x".repeat(QR_V40_BYTE_CAPACITY.L);

    expect(rawCodec.parseInput({ value })).toEqual({ value });
  });
});
