import { measurePayloadText, type PayloadTextMetrics } from "@/core/payload/payload-metrics";
import { payloadRegistry, type PayloadRegistry } from "@/core/payload/payload-registry";
import type {
  PayloadId,
  PayloadInspection,
  RegisteredPayloadDefinition,
} from "@/core/payload/payload";

export type PayloadInspectorField = Readonly<{
  key: string;
  label: string;
  value: string;
}>;

export type PayloadInspectorResult = Readonly<{
  id: PayloadId;
  label: string;
  rawPayload: string;
  metrics: PayloadTextMetrics;
  fields: readonly PayloadInspectorField[];
  inspection: PayloadInspection<unknown>;
}>;

export type InspectPayloadOptions = Readonly<{
  preferredPayloadId?: PayloadId;
}>;

type PayloadRegistryReader = Pick<PayloadRegistry, "get" | "list">;

const ACRONYMS = new Map<string, string>([
  ["url", "URL"],
  ["uid", "UID"],
  ["dtstamp", "DTSTAMP"],
  ["ssid", "SSID"],
]);

function toFieldLabel(key: string): string {
  const acronym = ACRONYMS.get(key.toLowerCase());
  if (acronym) return acronym;

  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
}

function stringifyFieldValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (value === null) return "null";

  if (Array.isArray(value)) {
    if (value.every((item) => ["string", "number", "boolean"].includes(typeof item))) {
      return value.map(String).join(", ");
    }
    return null;
  }

  return null;
}

export function inspectionFields(data: unknown): readonly PayloadInspectorField[] {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    const value = stringifyFieldValue(data);
    return value === null ? [] : [{ key: "value", label: "Value", value }];
  }

  const fields: PayloadInspectorField[] = [];

  for (const [key, rawValue] of Object.entries(data)) {
    const value = stringifyFieldValue(rawValue);
    if (value === null) continue;

    fields.push({
      key,
      label: toFieldLabel(key),
      value,
    });
  }

  return fields;
}

function structuredCandidateIds(payload: string): readonly PayloadId[] {
  const trimmed = payload.trim();
  const lower = trimmed.toLowerCase();
  const ids: PayloadId[] = [];

  if (lower.startsWith("begin:vcalendar")) ids.push("event");
  if (lower.startsWith("begin:vcard")) ids.push("vcard");
  if (lower.startsWith("wifi:")) ids.push("wifi");
  if (lower.startsWith("mailto:")) ids.push("email");
  if (lower.startsWith("tel:")) ids.push("phone");
  if (lower.startsWith("sms:")) ids.push("sms");
  if (lower.startsWith("geo:")) ids.push("location");
  if (/^https:\/\/wa\.me\//i.test(trimmed)) ids.push("whatsapp");
  if (/^https?:\/\//i.test(trimmed)) ids.push("url");

  return ids;
}

function inspectWithDefinition(
  definition: RegisteredPayloadDefinition,
  payload: string,
): PayloadInspection<unknown> | null {
  try {
    return definition.inspect(payload);
  } catch {
    return null;
  }
}

function buildResult(
  definition: RegisteredPayloadDefinition,
  inspection: PayloadInspection<unknown>,
  payload: string,
): PayloadInspectorResult {
  return {
    id: inspection.id,
    label: definition.label,
    rawPayload: payload,
    metrics: measurePayloadText(payload),
    fields: inspectionFields(inspection.data),
    inspection,
  };
}

export function createPayloadInspector(registry: PayloadRegistryReader) {
  return function inspectPayload(
    payload: string,
    options: InspectPayloadOptions = {},
  ): PayloadInspectorResult | null {
    if (payload.length === 0) return null;

    if (options.preferredPayloadId) {
      const preferred = registry.get(options.preferredPayloadId);
      const inspection = inspectWithDefinition(preferred, payload);
      if (inspection) return buildResult(preferred, inspection, payload);
    }

    const tried = new Set<PayloadId>();
    if (options.preferredPayloadId) tried.add(options.preferredPayloadId);

    for (const id of structuredCandidateIds(payload)) {
      if (tried.has(id)) continue;
      tried.add(id);

      const definition = registry.get(id);
      const inspection = inspectWithDefinition(definition, payload);
      if (inspection) return buildResult(definition, inspection, payload);
    }

    // Generic scanner-style detection intentionally falls back to curated Text.
    // Raw is never auto-detected because it would swallow every non-empty value;
    // it is selected only when the caller already knows the payload is Raw.
    if (!tried.has("text")) {
      const text = registry.get("text");
      const inspection = inspectWithDefinition(text, payload);
      if (inspection) return buildResult(text, inspection, payload);
    }

    return null;
  };
}

export const inspectPayload = createPayloadInspector(payloadRegistry);
