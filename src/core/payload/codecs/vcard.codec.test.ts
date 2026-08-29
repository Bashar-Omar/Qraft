import { describe, expect, it } from "vitest";

import { vcardCodec } from "@/core/payload/codecs/vcard.codec";

describe("vCard payload", () => {
  it("encodes a standards-based vCard 4.0 contact with CRLF lines", () => {
    const data = vcardCodec.parseInput({
      firstName: "Avery",
      lastName: "Morgan",
      organization: "Qraft; Studio",
      title: "Creative Director",
      phone: "+1 (202) 555-0123",
      email: "avery@example.com",
      url: "example.com",
    });
    const payload = vcardCodec.encode(data);

    expect(payload).toContain("BEGIN:VCARD\r\nVERSION:4.0\r\n");
    expect(payload).toContain("FN:Avery Morgan\r\n");
    expect(payload).toContain("N:Morgan;Avery;;;\r\n");
    expect(payload).toContain("ORG:Qraft\\; Studio\r\n");
    expect(payload).toContain("TEL;TYPE=cell;VALUE=uri:tel:+12025550123\r\n");
    expect(payload).toContain("EMAIL:avery@example.com\r\n");
    expect(payload).toContain("URL:https://example.com\r\n");
    expect(payload.endsWith("END:VCARD\r\n")).toBe(true);
  });

  it("folds long UTF-8 content lines and can inspect its own canonical output", () => {
    const data = vcardCodec.parseInput({
      firstName: "أفيري",
      lastName: "مورغان",
      organization: "Qraft Studio — القاهرة — فريق التصميم الإبداعي الدولي",
      title: "Creative Director",
      phone: "+201001234567",
      email: "avery@example.com",
      url: "https://example.com",
    });
    const payload = vcardCodec.encode(data);

    expect(payload).toContain("\r\n ");
    expect(vcardCodec.inspect(payload)).toMatchObject({ id: "vcard", data });
  });

  it("requires a contact name", () => {
    expect(() =>
      vcardCodec.parseInput({
        firstName: "",
        lastName: "",
        organization: "Qraft",
        title: "",
        phone: "",
        email: "",
        url: "",
      }),
    ).toThrow(/contact details/i);
  });

  it("rejects invalid optional contact channels", () => {
    expect(() =>
      vcardCodec.parseInput({
        firstName: "Avery",
        lastName: "Morgan",
        organization: "",
        title: "",
        phone: "123",
        email: "not-an-email",
        url: "javascript:alert(1)",
      }),
    ).toThrow(/contact details/i);
  });
});
