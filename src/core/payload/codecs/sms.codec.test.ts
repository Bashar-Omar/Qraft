import { describe, expect, it } from "vitest";

import { smsCodec } from "@/core/payload/codecs/sms.codec";
import { PayloadValidationError } from "@/core/payload/payload";

describe("smsCodec", () => {
  it("encodes a recipient and UTF-8 body using the sms URI body field", () => {
    const data = smsCodec.parseInput({
      number: "+1 (202) 555-0123",
      body: "Hello from Qraft 👋",
    });

    expect(smsCodec.encode(data)).toBe("sms:+12025550123?body=Hello%20from%20Qraft%20%F0%9F%91%8B");
  });

  it("allows an empty message body", () => {
    const data = smsCodec.parseInput({ number: "+12025550123", body: "" });
    expect(smsCodec.encode(data)).toBe("sms:+12025550123");
  });

  it("rejects a local number without phone context", () => {
    expect(() => smsCodec.parseInput({ number: "5550123", body: "Hi" })).toThrow(
      PayloadValidationError,
    );
  });

  it("inspects payloads produced by the codec", () => {
    const payload = smsCodec.encode(smsCodec.parseInput({ number: "+12025550123", body: "مرحبا" }));

    expect(smsCodec.inspect(payload)?.data).toEqual({
      number: "+12025550123",
      body: "مرحبا",
    });
  });
});
