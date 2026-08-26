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
    id: "wifi",
    input: {
      ssid: "Qraft;Lab",
      security: "WPA",
      password: "example:only",
      hidden: true,
    },
  },
];

describe("Phase 1 common payload golden vectors", () => {
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
