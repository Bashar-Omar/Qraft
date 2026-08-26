import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
} from "@/core/payload/payload";
import { normalizeGlobalPhoneNumber } from "@/core/payload/phone-number";

export type PhonePayloadData = Readonly<{
  number: string;
}>;

function readPhoneInput(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "number" in input &&
    typeof input.number === "string"
  ) {
    return input.number;
  }

  throw new PayloadValidationError("Enter a phone number.", [
    { field: "number", message: "A phone number is required." },
  ]);
}

export const phoneCodec: PayloadCodec<PhonePayloadData> = {
  id: "phone",
  parseInput(input) {
    return { number: normalizeGlobalPhoneNumber(readPhoneInput(input)) };
  },
  encode(data) {
    return `tel:${data.number}`;
  },
  inspect(payload) {
    if (!payload.toLowerCase().startsWith("tel:")) {
      return null;
    }

    try {
      const number = decodeURIComponent(payload.slice("tel:".length));
      const data = phoneCodec.parseInput(number);
      return { id: "phone", data };
    } catch {
      return null;
    }
  },
};

export const phonePayloadDefinition: PayloadDefinition<PhonePayloadData> = {
  id: "phone",
  label: "Phone",
  description: "Start a call with an international phone number.",
  category: "general",
  sampleInput: "+1 202 555 0123",
  codec: phoneCodec,
};
