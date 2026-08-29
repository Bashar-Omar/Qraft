import { describe, expect, it } from "vitest";

import { DEFAULT_QR_DESIGN } from "@/core/design/qr-design";
import {
  QRAFT_PROJECT_KIND,
  QRAFT_PROJECT_SCHEMA_VERSION,
  migrateQraftProject,
  parseQraftProjectJson,
  toProjectJsonValue,
} from "@/core/project/qraft-project";

function project(overrides: Record<string, unknown> = {}) {
  return {
    kind: QRAFT_PROJECT_KIND,
    schemaVersion: QRAFT_PROJECT_SCHEMA_VERSION,
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
  it("parses v1 into fresh validated domain values", () => {
    const raw = project();
    const parsed = migrateQraftProject(raw);

    expect(parsed).toEqual(raw);
    expect(parsed).not.toBe(raw);
    expect(parsed.payload).not.toBe(raw.payload);
    expect(parsed.code.design).not.toBe(raw.code.design);
  });

  it("rejects newer or unsupported older project versions", () => {
    expect(() => migrateQraftProject(project({ schemaVersion: 2 }))).toThrow(/newer/i);
    expect(() => migrateQraftProject(project({ schemaVersion: 0 }))).toThrow(/cannot migrate/i);
  });

  it("rejects malformed JSON, unknown root keys and unsupported payload types", () => {
    expect(() => parseQraftProjectJson("{not-json")).toThrow(/not valid JSON/i);
    expect(() => migrateQraftProject({ ...project(), surprise: true })).toThrow(/unsupported key/i);
    expect(() =>
      migrateQraftProject({
        ...project(),
        payload: { id: "future-payload", input: "value" },
      }),
    ).toThrow(/payload type/i);
  });

  it("rejects dangerous object keys in saved payload data", () => {
    const input = JSON.parse('{"safe":1,"__proto__":{"polluted":true}}') as unknown;

    expect(() =>
      migrateQraftProject({
        ...project(),
        payload: { id: "text", input },
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
        ...project(),
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
