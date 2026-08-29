import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
} from "@/core/payload/payload";
import { normalizeGlobalPhoneNumber } from "@/core/payload/phone-number";

export type WhatsAppPayloadInput = Readonly<{
  number: string;
  message: string;
}>;

export type WhatsAppPayloadData = Readonly<{
  number: string;
  message: string;
}>;

const MAX_MESSAGE_LENGTH = 5_000;

function readInput(input: unknown): WhatsAppPayloadInput {
  if (typeof input !== "object" || input === null) {
    throw new PayloadValidationError("Enter WhatsApp details.", [
      { field: "number", message: "A WhatsApp number is required." },
    ]);
  }

  return {
    number: "number" in input && typeof input.number === "string" ? input.number : "",
    message: "message" in input && typeof input.message === "string" ? input.message : "",
  };
}

export const whatsappCodec: PayloadCodec<WhatsAppPayloadData> = {
  id: "whatsapp",
  parseInput(input) {
    const raw = readInput(input);
    const number = normalizeGlobalPhoneNumber(raw.number, "number");

    if (number[1] === "0") {
      throw new PayloadValidationError("Use the full international WhatsApp number.", [
        {
          field: "number",
          message: "Do not include an international-prefix or trunk leading zero after +.",
        },
      ]);
    }

    if (raw.message.length > MAX_MESSAGE_LENGTH) {
      throw new PayloadValidationError("The WhatsApp message is too long for the curated editor.", [
        {
          field: "message",
          message: `Keep the message under ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`,
        },
      ]);
    }

    return { number, message: raw.message };
  },
  encode(data) {
    const digits = data.number.slice(1);
    return `https://wa.me/${digits}${data.message ? `?text=${encodeURIComponent(data.message)}` : ""}`;
  },
  inspect(payload) {
    try {
      const url = new URL(payload);

      if (
        url.protocol !== "https:" ||
        url.hostname.toLowerCase() !== "wa.me" ||
        url.port ||
        url.username ||
        url.password ||
        url.hash
      ) {
        return null;
      }

      const path = url.pathname.replace(/^\/+|\/+$/g, "");
      if (!/^[1-9]\d{2,14}$/.test(path)) {
        return null;
      }

      for (const key of url.searchParams.keys()) {
        if (key !== "text") {
          return null;
        }
      }

      const data = whatsappCodec.parseInput({
        number: `+${path}`,
        message: url.searchParams.get("text") ?? "",
      });

      return { id: "whatsapp", data };
    } catch {
      return null;
    }
  },
};

export const whatsappPayloadDefinition: PayloadDefinition<WhatsAppPayloadData> = {
  id: "whatsapp",
  label: "WhatsApp",
  description: "Open a WhatsApp chat with an optional pre-filled message.",
  category: "popular",
  sampleInput: {
    number: "+1 202 555 0123",
    message: "Hello from Qraft 👋",
  } satisfies WhatsAppPayloadInput,
  codec: whatsappCodec,
};
