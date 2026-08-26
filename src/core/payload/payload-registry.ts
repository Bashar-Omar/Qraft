import { emailPayloadDefinition } from "@/core/payload/codecs/email.codec";
import { phonePayloadDefinition } from "@/core/payload/codecs/phone.codec";
import { smsPayloadDefinition } from "@/core/payload/codecs/sms.codec";
import { textPayloadDefinition } from "@/core/payload/codecs/text.codec";
import { urlPayloadDefinition } from "@/core/payload/codecs/url.codec";
import { wifiPayloadDefinition } from "@/core/payload/codecs/wifi.codec";
import {
  registerPayloadDefinition,
  type PayloadId,
  type RegisteredPayloadDefinition,
} from "@/core/payload/payload";

const registeredPayloads = [
  registerPayloadDefinition(urlPayloadDefinition),
  registerPayloadDefinition(wifiPayloadDefinition),
  registerPayloadDefinition(emailPayloadDefinition),
  registerPayloadDefinition(phonePayloadDefinition),
  registerPayloadDefinition(smsPayloadDefinition),
  registerPayloadDefinition(textPayloadDefinition),
] as const;

export class PayloadRegistry {
  readonly #definitions: ReadonlyMap<PayloadId, RegisteredPayloadDefinition>;

  constructor(definitions: readonly RegisteredPayloadDefinition[]) {
    const entries = new Map<PayloadId, RegisteredPayloadDefinition>();

    for (const definition of definitions) {
      if (entries.has(definition.id)) {
        throw new Error(`Duplicate payload id: ${definition.id}`);
      }

      entries.set(definition.id, definition);
    }

    this.#definitions = entries;
  }

  list(): readonly RegisteredPayloadDefinition[] {
    return [...this.#definitions.values()];
  }

  get(id: PayloadId): RegisteredPayloadDefinition {
    const definition = this.#definitions.get(id);

    if (!definition) {
      throw new Error(`Unknown payload id: ${id}`);
    }

    return definition;
  }
}

export const payloadRegistry = new PayloadRegistry(registeredPayloads);
