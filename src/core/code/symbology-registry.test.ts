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
  catalog: { domains: ["general"], keywords: ["duplicate"] },
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
  it("marks the Phase 4D curated linear and retail slice live", () => {
    expect(symbologyRegistry.listLive().map((definition) => definition.id)).toEqual([
      "qr",
      "code128",
      "code39",
      "code93",
      "itf",
      "itf14",
      "ean13",
      "ean8",
      "upca",
      "upce",
      "datamatrix",
      "pdf417",
      "aztec",
    ]);
  });

  it("stores capability metadata in one Qraft-owned source", () => {
    expect(symbologyRegistry.get("qr").capabilities.logo).toBe(true);
    expect(symbologyRegistry.get("code128").capabilities.humanReadableText).toBe(true);
    expect(symbologyRegistry.get("code128").capabilities.gradient).toBe(false);
    expect(symbologyRegistry.get("datamatrix").family).toBe("matrix");
    expect(symbologyRegistry.get("ean13").family).toBe("linear");
    expect(symbologyRegistry.get("upce").capabilities.humanReadableText).toBe(true);
    expect(symbologyRegistry.get("pdf417").family).toBe("stacked");
    expect(symbologyRegistry.get("aztec").capabilities.quietZone).toBe(false);
  });

  it("searches Qraft-owned catalog metadata by aliases, family and use-case terms", () => {
    expect(symbologyRegistry.search({ query: "gtin retail", availability: "live" }).map((item) => item.id)).toEqual([
      "itf14",
      "ean13",
      "ean8",
      "upca",
      "upce",
    ]);
    expect(symbologyRegistry.search({ family: "stacked", availability: "live" }).map((item) => item.id)).toEqual([
      "pdf417",
    ]);
    expect(symbologyRegistry.search({ query: "boarding pass" }).map((item) => item.id)).toEqual([
      "aztec",
    ]);
  });

  it("rejects duplicate registrations", () => {
    expect(() => new SymbologyRegistry([duplicate, duplicate])).toThrow(/duplicate symbology/i);
  });
});
