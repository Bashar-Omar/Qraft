import { describe, expect, it } from "vitest";

import { SymbologyRegistry, symbologyRegistry } from "@/core/code/symbology-registry";
import type { SymbologyDefinition } from "@/core/code/symbology";

const duplicate: SymbologyDefinition = {
  id: "qr",
  label: "Duplicate QR",
  aliases: [],
  family: "matrix",
  tier: "curated",
  availability: "live",
  summary: "duplicate",
  capabilities: {
    vector: true,
    raster: true,
    logo: false,
    gradient: false,
    errorCorrection: true,
    humanReadableText: false,
    quietZone: true,
    physicalSizing: true,
  },
};

describe("symbology registry", () => {
  it("marks only the Phase 4C curated slice live", () => {
    expect(symbologyRegistry.listLive().map((definition) => definition.id)).toEqual([
      "qr",
      "code128",
      "datamatrix",
    ]);
  });

  it("stores capability metadata in one Qraft-owned source", () => {
    expect(symbologyRegistry.get("qr").capabilities.logo).toBe(true);
    expect(symbologyRegistry.get("code128").capabilities.humanReadableText).toBe(true);
    expect(symbologyRegistry.get("code128").capabilities.gradient).toBe(false);
    expect(symbologyRegistry.get("datamatrix").family).toBe("matrix");
  });

  it("rejects duplicate registrations", () => {
    expect(() => new SymbologyRegistry([duplicate, duplicate])).toThrow(/duplicate symbology/i);
  });
});
