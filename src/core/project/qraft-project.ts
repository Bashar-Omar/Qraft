import type { QrErrorCorrectionLevel } from "@/core/code/render";
import { parseQrDesign, type QraftQrDesign } from "@/core/design/qr-design";
import { QR_LOGO_LIMITS } from "@/core/design/qr-logo";
import type { PayloadId } from "@/core/payload/payload";
import { parseRasterPixelSize, type RasterPixelSize } from "@/core/export/raster";

export const QRAFT_PROJECT_KIND = "qraft-project" as const;
export const QRAFT_PROJECT_SCHEMA_VERSION = 1 as const;
export const QRAFT_PROJECT_MAX_FILE_BYTES = 6 * 1024 * 1024;
export const QRAFT_PROJECT_MAX_EMBEDDED_LOGO_BYTES = 4 * 1024 * 1024;
export const QRAFT_PROJECT_MAX_JSON_DEPTH = 32;
export const QRAFT_PROJECT_MAX_JSON_NODES = 5000;

const PAYLOAD_IDS = new Set<PayloadId>([
  "url",
  "wifi",
  "email",
  "phone",
  "sms",
  "text",
  "vcard",
  "whatsapp",
  "location",
  "event",
  "app",
  "social",
  "raw",
]);
const ECC_LEVELS = new Set<QrErrorCorrectionLevel>(["L", "M", "Q", "H"]);
const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export type ProjectJsonPrimitive = string | number | boolean | null;
export type ProjectJsonValue =
  ProjectJsonPrimitive | readonly ProjectJsonValue[] | { readonly [key: string]: ProjectJsonValue };

export type QraftProjectEmbeddedLogoV1 = Readonly<{
  encoding: "base64";
  mimeType: "image/png";
  data: string;
  bytes: number;
  width: number;
  height: number;
  name: string;
}>;

export type QraftProjectDocumentV1 = Readonly<{
  kind: typeof QRAFT_PROJECT_KIND;
  schemaVersion: typeof QRAFT_PROJECT_SCHEMA_VERSION;
  payload: Readonly<{
    id: PayloadId;
    input: ProjectJsonValue;
  }>;
  code: Readonly<{
    symbology: "qr";
    errorCorrectionLevel: QrErrorCorrectionLevel;
    design: QraftQrDesign;
  }>;
  export: Readonly<{
    rasterPixelSize: RasterPixelSize;
  }>;
  assets: Readonly<{
    logo?: QraftProjectEmbeddedLogoV1;
  }>;
}>;

export type QraftProjectDocument = QraftProjectDocumentV1;

export class QraftProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QraftProjectValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new QraftProjectValidationError(`${label} must be an object.`);
  }

  return value;
}

function assertOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key) || !allowedSet.has(key)) {
      throw new QraftProjectValidationError(`${label} contains an unsupported key: ${key}.`);
    }
  }
}

function decodedBase64ByteLength(value: string): number {
  if (value.length === 0) {
    return 0;
  }

  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return (value.length / 4) * 3 - padding;
}

function parsePayloadId(value: unknown): PayloadId {
  if (typeof value !== "string" || !PAYLOAD_IDS.has(value as PayloadId)) {
    throw new QraftProjectValidationError(
      "Project payload type is not supported by this Qraft version.",
    );
  }

  return value as PayloadId;
}

function parseEcc(value: unknown): QrErrorCorrectionLevel {
  if (typeof value !== "string" || !ECC_LEVELS.has(value as QrErrorCorrectionLevel)) {
    throw new QraftProjectValidationError("Project QR error-correction level is invalid.");
  }

  return value as QrErrorCorrectionLevel;
}

function validateJsonValue(root: unknown): ProjectJsonValue {
  const stack: Array<Readonly<{ value: unknown; depth: number }>> = [{ value: root, depth: 0 }];
  let nodes = 0;

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      break;
    }

    nodes += 1;
    if (nodes > QRAFT_PROJECT_MAX_JSON_NODES) {
      throw new QraftProjectValidationError("Project payload input contains too many values.");
    }

    if (current.depth > QRAFT_PROJECT_MAX_JSON_DEPTH) {
      throw new QraftProjectValidationError("Project payload input is nested too deeply.");
    }

    const value = current.value;

    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        stack.push({ value: item, depth: current.depth + 1 });
      }
      continue;
    }

    if (isRecord(value)) {
      for (const [key, item] of Object.entries(value)) {
        if (DANGEROUS_KEYS.has(key)) {
          throw new QraftProjectValidationError(`Project payload contains a blocked key: ${key}.`);
        }
        stack.push({ value: item, depth: current.depth + 1 });
      }
      continue;
    }

    throw new QraftProjectValidationError("Project payload input must contain JSON data only.");
  }

  return root as ProjectJsonValue;
}

function parseEmbeddedLogo(value: unknown): QraftProjectEmbeddedLogoV1 {
  const logo = expectRecord(value, "Embedded logo");
  assertOnlyKeys(
    logo,
    ["encoding", "mimeType", "data", "bytes", "width", "height", "name"],
    "Embedded logo",
  );

  if (logo.encoding !== "base64" || logo.mimeType !== "image/png") {
    throw new QraftProjectValidationError(
      "Embedded project logos must be base64-encoded PNG data.",
    );
  }

  if (typeof logo.data !== "string" || logo.data.length === 0 || !BASE64_PATTERN.test(logo.data)) {
    throw new QraftProjectValidationError("Embedded project logo data is not valid base64.");
  }

  if (
    typeof logo.bytes !== "number" ||
    !Number.isInteger(logo.bytes) ||
    logo.bytes < 1 ||
    logo.bytes > QRAFT_PROJECT_MAX_EMBEDDED_LOGO_BYTES ||
    decodedBase64ByteLength(logo.data) !== logo.bytes
  ) {
    throw new QraftProjectValidationError(
      "Embedded project logo size is outside the safe limit or does not match its data.",
    );
  }

  if (
    typeof logo.width !== "number" ||
    !Number.isInteger(logo.width) ||
    logo.width < QR_LOGO_LIMITS.normalizedMinDimension ||
    logo.width > QR_LOGO_LIMITS.normalizedMaxDimension ||
    typeof logo.height !== "number" ||
    !Number.isInteger(logo.height) ||
    logo.height < QR_LOGO_LIMITS.normalizedMinDimension ||
    logo.height > QR_LOGO_LIMITS.normalizedMaxDimension ||
    logo.width !== logo.height
  ) {
    throw new QraftProjectValidationError("Embedded project logo dimensions are invalid.");
  }

  if (
    typeof logo.name !== "string" ||
    logo.name.trim().length < 1 ||
    logo.name.length > 120 ||
    /[\u0000-\u001f\u007f]/.test(logo.name)
  ) {
    throw new QraftProjectValidationError("Embedded project logo name is invalid.");
  }

  return {
    encoding: "base64",
    mimeType: "image/png",
    data: logo.data,
    bytes: logo.bytes,
    width: logo.width,
    height: logo.height,
    name: logo.name,
  };
}

function parseV1(value: unknown): QraftProjectDocumentV1 {
  const root = expectRecord(value, "Qraft project");
  assertOnlyKeys(
    root,
    ["kind", "schemaVersion", "payload", "code", "export", "assets"],
    "Qraft project",
  );

  if (root.kind !== QRAFT_PROJECT_KIND) {
    throw new QraftProjectValidationError("This file is not a Qraft project.");
  }

  if (root.schemaVersion !== QRAFT_PROJECT_SCHEMA_VERSION) {
    throw new QraftProjectValidationError(
      "Qraft project schema version is invalid after migration.",
    );
  }

  const payload = expectRecord(root.payload, "Project payload");
  const code = expectRecord(root.code, "Project code settings");
  const exportSettings = expectRecord(root.export, "Project export settings");
  const assets = expectRecord(root.assets, "Project assets");
  assertOnlyKeys(payload, ["id", "input"], "Project payload");
  assertOnlyKeys(code, ["symbology", "errorCorrectionLevel", "design"], "Project code settings");
  assertOnlyKeys(exportSettings, ["rasterPixelSize"], "Project export settings");
  assertOnlyKeys(assets, ["logo"], "Project assets");
  const design = parseQrDesign(code.design);
  const logo = assets.logo === undefined ? undefined : parseEmbeddedLogo(assets.logo);

  if (code.symbology !== "qr") {
    throw new QraftProjectValidationError(
      "This project uses a code type not supported by this Qraft version.",
    );
  }

  if (Boolean(design.logo) !== Boolean(logo)) {
    throw new QraftProjectValidationError(
      "Project logo geometry and embedded logo asset must either both be present or both be absent.",
    );
  }

  return {
    kind: QRAFT_PROJECT_KIND,
    schemaVersion: QRAFT_PROJECT_SCHEMA_VERSION,
    payload: {
      id: parsePayloadId(payload.id),
      input: validateJsonValue(payload.input),
    },
    code: {
      symbology: "qr",
      errorCorrectionLevel: parseEcc(code.errorCorrectionLevel),
      design,
    },
    export: {
      rasterPixelSize: parseRasterPixelSize(exportSettings.rasterPixelSize),
    },
    assets: logo ? { logo } : {},
  };
}

type ProjectMigration = (value: Record<string, unknown>) => Record<string, unknown>;
const PROJECT_MIGRATIONS: Readonly<Record<number, ProjectMigration>> = Object.freeze({});

function readSchemaVersion(value: Record<string, unknown>): number {
  const version = value.schemaVersion;
  if (typeof version !== "number" || !Number.isInteger(version)) {
    throw new QraftProjectValidationError("Qraft project schema version is missing or invalid.");
  }
  return version;
}

export function migrateQraftProject(value: unknown): QraftProjectDocumentV1 {
  let current = expectRecord(value, "Qraft project");

  if (current.kind !== QRAFT_PROJECT_KIND) {
    throw new QraftProjectValidationError("This file is not a Qraft project.");
  }

  let schemaVersion = readSchemaVersion(current);

  if (schemaVersion > QRAFT_PROJECT_SCHEMA_VERSION) {
    throw new QraftProjectValidationError(
      `This project uses schema v${schemaVersion}, which is newer than this Qraft version supports.`,
    );
  }

  while (schemaVersion < QRAFT_PROJECT_SCHEMA_VERSION) {
    const migration = PROJECT_MIGRATIONS[schemaVersion];
    if (!migration) {
      throw new QraftProjectValidationError(
        `This Qraft version cannot migrate project schema v${schemaVersion}.`,
      );
    }
    current = migration(current);
    schemaVersion = readSchemaVersion(current);
  }

  return parseV1(current);
}

export function parseQraftProjectJson(text: string): QraftProjectDocument {
  let raw: unknown;

  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new QraftProjectValidationError("The selected project file is not valid JSON.");
  }

  return migrateQraftProject(raw);
}

export function toProjectJsonValue(value: unknown): ProjectJsonValue {
  const validated = validateJsonValue(value);
  return JSON.parse(JSON.stringify(validated)) as ProjectJsonValue;
}
