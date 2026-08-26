import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
} from "@/core/payload/payload";
import { normalizeGlobalPhoneNumber } from "@/core/payload/phone-number";

export type SmsPayloadInput = Readonly<{
  number: string;
  body: string;
}>;

export type SmsPayloadData = Readonly<{
  number: string;
  body: string;
}>;

const MAX_SMS_BODY_LENGTH = 1_600;

function readSmsInput(input: unknown): SmsPayloadInput {
  if (typeof input !== "object" || input === null) {
    throw new PayloadValidationError("Enter SMS details.", [
      { field: "number", message: "A recipient number is required." },
    ]);
  }

  return {
    number: "number" in input && typeof input.number === "string" ? input.number : "",
    body: "body" in input && typeof input.body === "string" ? input.body : "",
  };
}

export const smsCodec: PayloadCodec<SmsPayloadData> = {
  id: "sms",
  parseInput(input) {
    const raw = readSmsInput(input);
    const number = normalizeGlobalPhoneNumber(raw.number, "number");

    if (raw.body.length > MAX_SMS_BODY_LENGTH) {
      throw new PayloadValidationError("The SMS message is too long for the curated editor.", [
        {
          field: "body",
          message: `Keep the message under ${MAX_SMS_BODY_LENGTH.toLocaleString()} characters.`,
        },
      ]);
    }

    return { number, body: raw.body };
  },
  encode(data) {
    return `sms:${data.number}${data.body ? `?body=${encodeURIComponent(data.body)}` : ""}`;
  },
  inspect(payload) {
    if (!payload.toLowerCase().startsWith("sms:")) {
      return null;
    }

    try {
      const value = payload.slice("sms:".length);
      const queryIndex = value.indexOf("?");
      const number = decodeURIComponent(queryIndex >= 0 ? value.slice(0, queryIndex) : value);
      const params = new URLSearchParams(queryIndex >= 0 ? value.slice(queryIndex + 1) : "");
      const data = smsCodec.parseInput({ number, body: params.get("body") ?? "" });
      return { id: "sms", data };
    } catch {
      return null;
    }
  },
};

export const smsPayloadDefinition: PayloadDefinition<SmsPayloadData> = {
  id: "sms",
  label: "SMS",
  description: "Prepare a text message to an international number.",
  category: "general",
  sampleInput: {
    number: "+1 202 555 0123",
    body: "Hello from Qraft.",
  } satisfies SmsPayloadInput,
  codec: smsCodec,
};
