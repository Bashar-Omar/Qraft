import { describe, expect, it } from "vitest";

import { emailCodec } from "@/core/payload/codecs/email.codec";
import { PayloadValidationError } from "@/core/payload/payload";

describe("emailCodec", () => {
  it("encodes recipients, UTF-8 subject and CRLF message body", () => {
    const data = emailCodec.parseInput({
      recipients: "hello@example.com, team+qr@example.org",
      subject: "Qraft café",
      body: "Line one\nLine two",
    });

    expect(emailCodec.encode(data)).toBe(
      "mailto:hello@example.com,team%2Bqr@example.org?subject=Qraft%20caf%C3%A9&body=Line%20one%0D%0ALine%20two",
    );
  });

  it("normalizes an internationalized domain through the URL parser", () => {
    const data = emailCodec.parseInput({
      recipients: "hello@bücher.example",
      subject: "",
      body: "",
    });

    expect(data.recipients).toEqual(["hello@xn--bcher-kva.example"]);
  });

  it("rejects malformed mailboxes", () => {
    expect(() =>
      emailCodec.parseInput({ recipients: "not-an-email", subject: "", body: "" }),
    ).toThrow(PayloadValidationError);
  });

  it("inspects payloads produced by the codec", () => {
    const payload = emailCodec.encode(
      emailCodec.parseInput({
        recipients: "hello@example.com",
        subject: "Hello",
        body: "First\nSecond",
      }),
    );

    expect(emailCodec.inspect(payload)?.data).toEqual({
      recipients: ["hello@example.com"],
      subject: "Hello",
      body: "First\nSecond",
    });
  });
});
