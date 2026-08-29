import { describe, expect, it } from "vitest";

import { whatsappCodec } from "@/core/payload/codecs/whatsapp.codec";

describe("WhatsApp payload", () => {
  it("normalizes an international number and URL-encodes the message", () => {
    const data = whatsappCodec.parseInput({
      number: "+1 (202) 555-0123",
      message: "Hello from Qraft 👋",
    });

    expect(data.number).toBe("+12025550123");
    expect(whatsappCodec.encode(data)).toBe(
      "https://wa.me/12025550123?text=Hello%20from%20Qraft%20%F0%9F%91%8B",
    );
  });

  it("allows an empty pre-filled message", () => {
    const data = whatsappCodec.parseInput({ number: "+12025550123", message: "" });
    expect(whatsappCodec.encode(data)).toBe("https://wa.me/12025550123");
  });

  it("inspects only the supported wa.me shape", () => {
    expect(whatsappCodec.inspect("https://wa.me/12025550123?text=Hello%20Qraft")).toMatchObject({
      id: "whatsapp",
      data: { number: "+12025550123", message: "Hello Qraft" },
    });
    expect(whatsappCodec.inspect("https://example.com/12025550123")).toBeNull();
    expect(whatsappCodec.inspect("https://wa.me/12025550123?foo=bar")).toBeNull();
  });

  it("rejects numbers outside the curated international format", () => {
    expect(() => whatsappCodec.parseInput({ number: "020 555 0123", message: "" })).toThrow(
      /international/i,
    );
  });
});
