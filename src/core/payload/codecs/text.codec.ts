import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
} from "@/core/payload/payload";

export type TextPayloadData = Readonly<{
  text: string;
}>;

const MAX_TEXT_LENGTH = 32_000;

function readTextInput(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (
    typeof input === "object" &&
    input !== null &&
    "text" in input &&
    typeof input.text === "string"
  ) {
    return input.text;
  }

  throw new PayloadValidationError("Enter some text.", [
    { field: "text", message: "Text is required." },
  ]);
}

export const textCodec: PayloadCodec<TextPayloadData> = {
  id: "text",
  parseInput(input) {
    const text = readTextInput(input);

    if (!text.trim()) {
      throw new PayloadValidationError("Enter some text.", [
        { field: "text", message: "Text cannot be empty." },
      ]);
    }

    if (text.length > MAX_TEXT_LENGTH) {
      throw new PayloadValidationError("This text is too long for the editor.", [
        {
          field: "text",
          message: `Keep text under ${MAX_TEXT_LENGTH.toLocaleString()} characters.`,
        },
      ]);
    }

    return { text };
  },
  encode(data) {
    return data.text;
  },
  inspect(payload) {
    if (!payload.trim()) {
      return null;
    }

    return {
      id: "text",
      data: { text: payload },
    };
  },
};

export const textPayloadDefinition: PayloadDefinition<TextPayloadData> = {
  id: "text",
  label: "Text",
  description: "Encode plain text exactly as entered.",
  category: "general",
  sampleInput: "Craft codes that work.",
  codec: textCodec,
};
