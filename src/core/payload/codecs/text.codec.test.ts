import { describe, expect, it } from "vitest";

import { textCodec } from "@/core/payload/codecs/text.codec";
import { PayloadValidationError } from "@/core/payload/payload";

describe("textCodec", () => {
  it("preserves text exactly", () => {
    const input = "Line one\nLine two  ";
    const data = textCodec.parseInput(input);

    expect(textCodec.encode(data)).toBe(input);
  });

  it("supports unicode text", () => {
    const input = "Qraft — مرحبًا 👋";
    expect(textCodec.encode(textCodec.parseInput(input))).toBe(input);
  });

  it("rejects whitespace-only text", () => {
    expect(() => textCodec.parseInput("\n\t  ")).toThrow(PayloadValidationError);
  });
});
