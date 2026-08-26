import { describe, expect, it } from "vitest";

import { phoneCodec } from "@/core/payload/codecs/phone.codec";
import { PayloadValidationError } from "@/core/payload/payload";

describe("phoneCodec", () => {
  it("normalizes visual separators into a global tel URI", () => {
    const data = phoneCodec.parseInput("+1 (202) 555-0123");

    expect(data.number).toBe("+12025550123");
    expect(phoneCodec.encode(data)).toBe("tel:+12025550123");
  });

  it("requires international +country-code form", () => {
    expect(() => phoneCodec.parseInput("020 7946 0018")).toThrow(PayloadValidationError);
  });

  it("inspects a tel payload", () => {
    expect(phoneCodec.inspect("tel:+12025550123")?.data).toEqual({ number: "+12025550123" });
  });
});
