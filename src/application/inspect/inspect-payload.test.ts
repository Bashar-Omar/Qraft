import { describe, expect, it } from "vitest";

import { inspectPayload } from "@/application/inspect/inspect-payload";
import { payloadRegistry } from "@/core/payload/payload-registry";

const structuredFixtures = [
  ["wifi", "WIFI:T:WPA;S:Qraft Lab;P:example-only;;"],
  ["email", "mailto:hello@example.com?subject=Qraft"],
  ["phone", "tel:+12025550123"],
  ["sms", "sms:+12025550123?body=Hello"],
  ["vcard", "BEGIN:VCARD\r\nVERSION:4.0\r\nFN:Avery Morgan\r\nN:Morgan;Avery;;;\r\nEND:VCARD"],
  ["whatsapp", "https://wa.me/12025550123?text=Hello"],
  ["location", "geo:30.0444,31.2357"],
] as const;

describe("inspectPayload", () => {
  for (const [id, payload] of structuredFixtures) {
    it(`detects ${id} from an explicit payload signature`, () => {
      expect(inspectPayload(payload)?.id).toBe(id);
    });
  }

  it("detects Event before generic text", () => {
    const event = payloadRegistry.get("event").parseAndEncode({
      title: "Qraft review",
      allDay: false,
      startDate: "",
      endDate: "",
      startDateTime: "2026-09-01T10:00",
      endDateTime: "2026-09-01T11:00",
      timeMode: "utc",
      location: "Studio A",
      description: "Inspector fixture",
      url: "https://example.com/event",
      uid: "urn:uuid:00000000-0000-4000-8000-000000000901",
      dtstamp: "20260829T150000Z",
    });

    expect(inspectPayload(event.payload)?.id).toBe("event");
  });

  it("detects WhatsApp before the broader HTTPS URL codec", () => {
    expect(inspectPayload("https://wa.me/12025550123?text=Hello")?.id).toBe("whatsapp");
  });

  it("detects known social hosts before the broader HTTPS URL codec", () => {
    expect(inspectPayload("https://x.com/OpenAI")?.id).toBe("social");
    expect(inspectPayload("https://www.youtube.com/@youtubecreators")?.id).toBe("social");
    expect(inspectPayload("https://example.com/profile/qraft")?.id).toBe("url");
  });

  it("only auto-detects URL when an HTTP(S) scheme is explicit", () => {
    expect(inspectPayload("https://example.com")?.id).toBe("url");
    expect(inspectPayload("example.com")?.id).toBe("text");
  });

  it("keeps non-HTTP URI schemes inert as text during generic inspection", () => {
    expect(inspectPayload("javascript:alert(1)")?.id).toBe("text");
    expect(inspectPayload("data:text/html,<b>example</b>")?.id).toBe("text");
  });

  it("labels App Link only when the caller knows that intent", () => {
    const httpsDestination = "https://example.com/app/products/42";
    const customDestination = "qraftdemo://product/42?ref=qr";

    expect(inspectPayload(httpsDestination)?.id).toBe("url");
    expect(inspectPayload(customDestination)?.id).toBe("text");

    expect(inspectPayload(httpsDestination, { preferredPayloadId: "app" })).toMatchObject({
      id: "app",
      inspection: { data: { strategy: "https", host: "example.com" } },
    });
    expect(inspectPayload(customDestination, { preferredPayloadId: "app" })).toMatchObject({
      id: "app",
      inspection: { data: { strategy: "custom-scheme", scheme: "qraftdemo" } },
    });
  });

  it("preserves Raw identity when the caller provides the known payload type", () => {
    const exact = "  raw://example\r\nمرحبا 👋  ";
    const result = inspectPayload(exact, { preferredPayloadId: "raw" });

    expect(result).toMatchObject({ id: "raw", rawPayload: exact });
    expect(result?.inspection.data).toEqual({ value: exact });
    expect(result?.metrics.utf8Bytes).toBe(new TextEncoder().encode(exact).byteLength);
  });

  it("round-trips every registered sample through its own inspector", () => {
    for (const definition of payloadRegistry.list()) {
      const encoded = definition.parseAndEncode(definition.createInitialInput());
      const result = inspectPayload(encoded.payload, { preferredPayloadId: definition.id });

      expect(result?.id).toBe(definition.id);
    }
  });

  it("exposes safe primitive inspection rows without recursively rendering objects", () => {
    const result = inspectPayload("mailto:hello@example.com?subject=Qraft", {
      preferredPayloadId: "email",
    });

    expect(
      result?.fields.some((field) => field.label === "Subject" && field.value === "Qraft"),
    ).toBe(true);
  });

  it("records whether classification came from known intent, a signature or Text fallback", () => {
    expect(inspectPayload("https://example.com/app", { preferredPayloadId: "app" })?.basis).toBe(
      "preferred",
    );
    expect(inspectPayload("https://x.com/OpenAI")?.basis).toBe("signature");
    expect(inspectPayload("plain scanner result")?.basis).toBe("fallback");
  });

  it("exposes an explicit web destination only for credential-free HTTP(S) payloads", () => {
    expect(inspectPayload("https://example.com/path?q=1")?.destination).toEqual({
      scheme: "https",
      host: "example.com",
      href: "https://example.com/path?q=1",
      transport: "secure-web",
    });

    const insecure = inspectPayload("http://example.com/path");
    expect(insecure?.destination).toMatchObject({
      scheme: "http",
      host: "example.com",
      href: "http://example.com/path",
      transport: "insecure-web",
    });
    expect(insecure?.notices.some((notice) => notice.severity === "risk")).toBe(true);
  });

  it("keeps web URLs with embedded credentials copy-only", () => {
    const result = inspectPayload("https://user:secret@example.com/private");

    expect(result?.id).toBe("url");
    expect(result?.destination).toMatchObject({
      scheme: "https",
      host: "example.com",
      transport: "secure-web",
    });
    expect(result?.destination?.href).toBeUndefined();
    expect(result?.notices.some((notice) => /credentials/i.test(notice.message))).toBe(true);
  });

  it("keeps custom and executable schemes copy-only", () => {
    const app = inspectPayload("qraftdemo://product/42", { preferredPayloadId: "app" });
    expect(app?.destination).toEqual({ scheme: "qraftdemo", transport: "non-web" });
    expect(app?.destination?.href).toBeUndefined();
    expect(app?.notices.some((notice) => /not verified/i.test(notice.message))).toBe(true);

    const javascript = inspectPayload("javascript:alert(1)");
    expect(javascript?.id).toBe("text");
    expect(javascript?.destination).toEqual({ scheme: "javascript", transport: "non-web" });
    expect(javascript?.destination?.href).toBeUndefined();
  });

  it("explains that HTTPS app association is not verified", () => {
    const result = inspectPayload("https://example.com/app/products/42", {
      preferredPayloadId: "app",
    });

    expect(result?.destination).toMatchObject({
      scheme: "https",
      host: "example.com",
      transport: "secure-web",
    });
    expect(result?.notices.some((notice) => /does not verify/i.test(notice.message))).toBe(true);
  });
});
