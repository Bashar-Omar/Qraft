import { describe, expect, it } from "vitest";

import { DEFAULT_QR_DESIGN } from "@/core/design/qr-design";
import {
  QRAFT_PROJECT_KIND,
  QRAFT_PROJECT_SCHEMA_VERSION,
  QRAFT_PROJECT_SCHEMA_VERSION_V1,
  migrateQraftProject,
  parseQraftProjectJson,
  toProjectJsonValue,
} from "@/core/project/qraft-project";

function qrV2(overrides: Record<string, unknown> = {}) {
  return {
    kind: QRAFT_PROJECT_KIND,
    schemaVersion: QRAFT_PROJECT_SCHEMA_VERSION,
    content: { kind: "payload", payloadId: "url", input: "https://example.com" },
    code: {
      symbology: "qr",
      errorCorrectionLevel: "M",
      design: DEFAULT_QR_DESIGN,
    },
    export: { rasterPixelSize: 1024 },
    assets: {},
    ...overrides,
  };
}

function qrV1(overrides: Record<string, unknown> = {}) {
  return {
    kind: QRAFT_PROJECT_KIND,
    schemaVersion: QRAFT_PROJECT_SCHEMA_VERSION_V1,
    payload: { id: "url", input: "https://example.com" },
    code: {
      symbology: "qr",
      errorCorrectionLevel: "M",
      design: DEFAULT_QR_DESIGN,
    },
    export: { rasterPixelSize: 1024 },
    assets: {},
    ...overrides,
  };
}

describe("Qraft project schema", () => {
  it("parses schema v2 into fresh validated domain values", () => {
    const raw = qrV2();
    const parsed = migrateQraftProject(raw);

    expect(parsed).toEqual(raw);
    expect(parsed).not.toBe(raw);
    expect(parsed.content).not.toBe(raw.content);
    expect(parsed.code).not.toBe(raw.code);
  });

  it("migrates schema v1 QR projects explicitly into the schema v2 union", () => {
    const parsed = migrateQraftProject(qrV1());

    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.content).toEqual({
      kind: "payload",
      payloadId: "url",
      input: "https://example.com",
    });
    expect(parsed.code).toMatchObject({ symbology: "qr", errorCorrectionLevel: "M" });
  });

  it("parses validated barcode projects and rejects impossible capability state", () => {
    expect(
      migrateQraftProject({
        kind: QRAFT_PROJECT_KIND,
        schemaVersion: 2,
        content: { kind: "barcode", value: "QRAFT-128" },
        code: { symbology: "code128", humanReadableText: true },
        export: { rasterPixelSize: 2048 },
        assets: {},
      }),
    ).toMatchObject({
      content: { kind: "barcode", value: "QRAFT-128" },
      code: { symbology: "code128", humanReadableText: true },
    });

    expect(() =>
      migrateQraftProject({
        kind: QRAFT_PROJECT_KIND,
        schemaVersion: 2,
        content: { kind: "barcode", value: "matrix" },
        code: { symbology: "datamatrix", humanReadableText: true },
        export: { rasterPixelSize: 1024 },
        assets: {},
      }),
    ).toThrow(/human-readable text/i);
  });

  it("rejects newer or unsupported older project versions", () => {
    expect(() => migrateQraftProject(qrV2({ schemaVersion: 3 }))).toThrow(/newer/i);
    expect(() => migrateQraftProject(qrV2({ schemaVersion: 0 }))).toThrow(/cannot migrate/i);
  });

  it("rejects malformed JSON, unknown root keys and unsupported content types", () => {
    expect(() => parseQraftProjectJson("{not-json")).toThrow(/not valid JSON/i);
    expect(() => migrateQraftProject({ ...qrV2(), surprise: true })).toThrow(/unsupported key/i);
    expect(() =>
      migrateQraftProject({
        ...qrV2(),
        content: { kind: "payload", payloadId: "future-payload", input: "value" },
      }),
    ).toThrow(/payload type/i);
  });

  it("rejects dangerous object keys in saved payload data", () => {
    const input = JSON.parse('{"safe":1,"__proto__":{"polluted":true}}') as unknown;
    expect(() =>
      migrateQraftProject({
        ...qrV2(),
        content: { kind: "payload", payloadId: "text", input },
      }),
    ).toThrow(/blocked key/i);
  });

  it("requires embedded logo bytes to match logo geometry and metadata", () => {
    const data = "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhm";
    const logo = {
      encoding: "base64",
      mimeType: "image/png",
      data,
      bytes: 32,
      width: 256,
      height: 256,
      name: "logo.png",
    };

    expect(() =>
      migrateQraftProject({
        ...qrV2(),
        code: {
          symbology: "qr",
          errorCorrectionLevel: "Q",
          design: { ...DEFAULT_QR_DESIGN, logo: { sizePercent: 20, paddingModules: 0.5 } },
        },
        assets: { logo },
      }),
    ).toThrow(/size.*does not match|data/i);
  });

  it("copies JSON-only payload input and rejects non-JSON values", () => {
    const input = { message: "hello", nested: [1, true, null] };
    const copied = toProjectJsonValue(input);
    expect(copied).toEqual(input);
    expect(copied).not.toBe(input);
    expect(() => toProjectJsonValue({ value: undefined })).toThrow(/JSON data only/i);
  });
});
