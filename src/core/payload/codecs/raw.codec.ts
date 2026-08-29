import { QR_V40_BYTE_CAPACITY } from "@/core/code/qr-capacity";
import { measurePayloadText, type PayloadTextMetrics } from "@/core/payload/payload-metrics";
import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
} from "@/core/payload/payload";

export type RawPayloadInput = Readonly<{
  value: string;
}>;

export type RawPayloadData = RawPayloadInput;

export type RawPayloadMetrics = PayloadTextMetrics;

const ABSOLUTE_BYTE_MODE_LIMIT = QR_V40_BYTE_CAPACITY.L;

function readInput(input: unknown): RawPayloadInput {
  if (typeof input !== "object" || input === null) {
    throw new PayloadValidationError("Enter a raw payload.", [
      { field: "value", message: "Raw payload content is required." },
    ]);
  }

  const record = input as Record<string, unknown>;
  return {
    value: typeof record.value === "string" ? record.value : "",
  };
}

export function measureRawPayload(value: string): RawPayloadMetrics {
  return measurePayloadText(value);
}

function parseInput(input: unknown): RawPayloadData {
  const raw = readInput(input);
  const metrics = measureRawPayload(raw.value);

  if (raw.value.length === 0) {
    throw new PayloadValidationError("Enter a raw payload.", [
      { field: "value", message: "Raw payload content cannot be empty." },
    ]);
  }

  if (metrics.utf8Bytes > ABSOLUTE_BYTE_MODE_LIMIT) {
    throw new PayloadValidationError("This raw payload is too large for Qraft's QR byte mode.", [
      {
        field: "value",
        message: `Keep the exact UTF-8 payload at or below ${ABSOLUTE_BYTE_MODE_LIMIT.toLocaleString()} bytes. The selected ECC may require a smaller payload.`,
      },
    ]);
  }

  return { value: raw.value };
}

export const rawCodec: PayloadCodec<RawPayloadData> = {
  id: "raw",
  parseInput,
  encode(data) {
    return data.value;
  },
  inspect(payload) {
    if (payload.length === 0) {
      return null;
    }

    return {
      id: "raw",
      data: { value: payload },
    };
  },
};

export const rawPayloadDefinition: PayloadDefinition<RawPayloadData> = {
  id: "raw",
  label: "Raw",
  description: "Power-user payload with zero content normalization.",
  category: "general",
  sampleInput: {
    value: "Qraft raw payload\nExact bytes, no normalization.",
  },
  codec: rawCodec,
};
