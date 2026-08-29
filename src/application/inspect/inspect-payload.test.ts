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

  it("only auto-detects URL when an HTTP(S) scheme is explicit", () => {
    expect(inspectPayload("https://example.com")?.id).toBe("url");
    expect(inspectPayload("example.com")?.id).toBe("text");
  });

  it("keeps non-HTTP URI schemes inert as text during generic inspection", () => {
    expect(inspectPayload("javascript:alert(1)")?.id).toBe("text");
    expect(inspectPayload("data:text/html,<b>example</b>")?.id).toBe("text");
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
});
