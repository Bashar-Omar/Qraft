import { describe, expect, it } from "vitest";

import { appLinkCodec } from "@/core/payload/codecs/app-link.codec";
import { PayloadValidationError } from "@/core/payload/payload";

describe("appLinkCodec", () => {
  it("preserves a valid HTTPS app/universal link without claiming association verification", () => {
    const destination = "https://example.com/app/products/42?ref=qr#details";
    const data = appLinkCodec.parseInput({ strategy: "https", destination });

    expect(data).toEqual({
      strategy: "https",
      destination,
      scheme: "https",
      host: "example.com",
    });
    expect(appLinkCodec.encode(data)).toBe(destination);
  });

  it("requires HTTPS for the recommended web-link strategy", () => {
    expect(() =>
      appLinkCodec.parseInput({
        strategy: "https",
        destination: "http://example.com/app/products/42",
      }),
    ).toThrow(PayloadValidationError);
  });

  it("rejects embedded credentials in curated HTTPS app links", () => {
    expect(() =>
      appLinkCodec.parseInput({
        strategy: "https",
        destination: "https://user:secret@example.com/app",
      }),
    ).toThrow(/credentials/i);
  });

  it("accepts an app-owned custom URI scheme and preserves the exact destination", () => {
    const destination = "QraftDemo://product/42?ref=qr#details";
    const data = appLinkCodec.parseInput({ strategy: "custom-scheme", destination });

    expect(data).toEqual({
      strategy: "custom-scheme",
      destination,
      scheme: "qraftdemo",
    });
    expect(appLinkCodec.encode(data)).toBe(destination);
  });

  it("rejects web, dedicated Qraft and executable schemes in custom mode", () => {
    for (const destination of [
      "https://example.com/app",
      "mailto:hello@example.com",
      "tel:+12025550123",
      "geo:30,31",
      "javascript:alert(1)",
      "data:text/html,test",
      "intent://scan/#Intent;end",
    ]) {
      expect(() => appLinkCodec.parseInput({ strategy: "custom-scheme", destination })).toThrow(
        PayloadValidationError,
      );
    }
  });

  it("rejects malformed, empty and whitespace-bearing custom URIs", () => {
    for (const destination of [
      "",
      "example.com/path",
      "my app://open",
      "myapp://hello world",
      "myapp:%ZZ",
      "myapp:مرحبا",
    ]) {
      expect(() => appLinkCodec.parseInput({ strategy: "custom-scheme", destination })).toThrow(
        PayloadValidationError,
      );
    }
  });

  it("inspects both supported strategies but rejects unsafe or non-curated values", () => {
    expect(appLinkCodec.inspect("https://example.com/app")).toMatchObject({
      id: "app",
      data: { strategy: "https", scheme: "https", host: "example.com" },
    });
    expect(appLinkCodec.inspect("qraftdemo://product/42")).toMatchObject({
      id: "app",
      data: { strategy: "custom-scheme", scheme: "qraftdemo" },
    });
    expect(appLinkCodec.inspect("javascript:alert(1)")).toBeNull();
    expect(appLinkCodec.inspect(" https://example.com/app ")).toBeNull();
  });

  it("rejects destinations beyond the curated 2,048-character boundary", () => {
    const destination = `qraftdemo://${"x".repeat(2048)}`;

    expect(() => appLinkCodec.parseInput({ strategy: "custom-scheme", destination })).toThrow(
      /too long/i,
    );
  });
});
