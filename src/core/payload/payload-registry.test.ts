import { describe, expect, it } from "vitest";

import { payloadRegistry } from "@/core/payload/payload-registry";

describe("payloadRegistry", () => {
  it("exposes the first curated payloads in a stable order", () => {
    expect(payloadRegistry.list().map((definition) => definition.id)).toEqual(["url", "text"]);
  });

  it("encodes through the registered codec instead of UI conditionals", () => {
    const encoded = payloadRegistry.get("url").parseAndEncode("example.com");
    expect(encoded.payload).toBe("https://example.com");
  });
});
