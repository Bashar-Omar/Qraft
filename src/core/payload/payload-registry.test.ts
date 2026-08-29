import { describe, expect, it } from "vitest";

import { payloadRegistry } from "@/core/payload/payload-registry";

describe("payloadRegistry", () => {
  it("exposes curated payloads in a stable intent-first order", () => {
    expect(payloadRegistry.list().map((definition) => definition.id)).toEqual([
      "url",
      "wifi",
      "email",
      "phone",
      "sms",
      "text",
      "vcard",
      "whatsapp",
      "location",
    ]);
  });

  it("encodes through the registered codec instead of UI conditionals", () => {
    const encoded = payloadRegistry.get("wifi").parseAndEncode({
      ssid: "Qraft Lab",
      security: "WPA",
      password: "example-only",
      hidden: false,
    });

    expect(encoded.payload).toBe("WIFI:T:WPA;S:Qraft Lab;P:example-only;;");
  });
});
