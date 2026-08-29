import { describe, expect, it } from "vitest";

import { SAFE_QR_DEFAULTS } from "@/core/code/render";
import { payloadRegistry } from "@/core/payload/payload-registry";
import type { PayloadId } from "@/core/payload/payload";
import { standardQrRenderer } from "@/engines/render/standard-qr/standard-qr-renderer";
import { decodeQrMatrixForGoldenTest } from "@/test/qr-golden";

const cases: readonly Readonly<{
  id: PayloadId;
  input: unknown;
}>[] = [
  {
    id: "email",
    input: {
      recipients: "hello@example.com",
      subject: "Qraft café",
      body: "Hello 👋",
    },
  },
  {
    id: "phone",
    input: "+1 (202) 555-0123",
  },
  {
    id: "sms",
    input: {
      number: "+1 202 555 0123",
      body: "Hello from Qraft",
    },
  },
  {
    id: "vcard",
    input: {
      firstName: "Avery",
      lastName: "Morgan",
      organization: "Qraft Studio",
      title: "Creative Director",
      phone: "+1 202 555 0123",
      email: "avery@example.com",
      url: "https://example.com",
    },
  },
  {
    id: "whatsapp",
    input: {
      number: "+1 202 555 0123",
      message: "Hello from Qraft 👋",
    },
  },
  {
    id: "event",
    input: {
      title: "Qraft review",
      allDay: false,
      startDate: "",
      endDate: "",
      startDateTime: "2026-09-01T10:00",
      endDateTime: "2026-09-01T11:00",
      timeMode: "utc",
      location: "Studio A",
      description: "Golden event fixture",
      url: "https://example.com/event",
      uid: "urn:uuid:00000000-0000-4000-8000-000000000777",
      dtstamp: "20260829T120000Z",
    },
  },
  {
    id: "location",
    input: {
      latitude: "30.0444",
      longitude: "31.2357",
      altitude: "",
      uncertainty: "",
    },
  },
  {
    id: "app",
    input: {
      strategy: "https",
      destination: "https://example.com/app/products/42?ref=qraft",
    },
  },
  {
    id: "social",
    input: {
      platform: "youtube",
      target: "@youtubecreators",
    },
  },
  {
    id: "raw",
    input: {
      value: "  RAW\r\nQraft — مرحبًا 👋\n  ",
    },
  },
  {
    id: "wifi",
    input: {
      ssid: "Qraft;Lab",
      security: "WPA",
      password: "example:only",
      hidden: true,
    },
  },
];

describe("Common payload QR golden vectors", () => {
  for (const fixture of cases) {
    it(`round-trips the ${fixture.id} payload through QR rendering`, async () => {
      const encoded = payloadRegistry.get(fixture.id).parseAndEncode(fixture.input);
      const rendered = await standardQrRenderer.render({
        symbology: "qr",
        payload: encoded.payload,
        options: SAFE_QR_DEFAULTS,
      });

      expect(decodeQrMatrixForGoldenTest(rendered.verificationMatrix)).toBe(encoded.payload);
    });
  }
});
