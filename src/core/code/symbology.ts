/**
 * Qraft-owned symbology identifiers.
 *
 * Keep vendor encoder names out of core. Adapters translate these stable IDs
 * to whichever rendering engine they use.
 */
export type SymbologyId = "qr" | "code128" | "datamatrix";
export type BarcodeSymbologyId = Exclude<SymbologyId, "qr">;

export type SymbologyFamily = "matrix" | "linear";
export type SymbologyTier = "curated" | "expert" | "experimental";
export type SymbologyAvailability = "live" | "planned";

export type RenderCapabilities = Readonly<{
  vector: boolean;
  raster: boolean;
  logo: boolean;
  gradient: boolean;
  errorCorrection: boolean;
  humanReadableText: boolean;
  quietZone: boolean;
  physicalSizing: boolean;
}>;

export type SymbologyDefinition = Readonly<{
  id: SymbologyId;
  label: string;
  aliases: readonly string[];
  family: SymbologyFamily;
  tier: SymbologyTier;
  availability: SymbologyAvailability;
  summary: string;
  capabilities: RenderCapabilities;
}>;

const COMMON_CAPABILITIES = Object.freeze({
  vector: true,
  raster: true,
  physicalSizing: true,
});

/**
 * Phase 4A intentionally registers only the architecture-proof slice.
 * More formats are additive entries once their validation and golden vectors
 * exist; renderer package support alone is never enough to mark them live.
 */
export const SYMBOLOGY_DEFINITIONS: readonly SymbologyDefinition[] = Object.freeze([
  {
    id: "qr",
    label: "QR Code",
    aliases: ["qrcode", "qr-code"],
    family: "matrix",
    tier: "curated",
    availability: "live",
    summary: "Designer-friendly QR with local quality and export tooling.",
    capabilities: {
      ...COMMON_CAPABILITIES,
      logo: true,
      gradient: true,
      errorCorrection: true,
      humanReadableText: false,
      quietZone: true,
    },
  },
  {
    id: "code128",
    label: "Code 128",
    aliases: ["code-128"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Dense general-purpose linear barcode for text and identifiers.",
    capabilities: {
      ...COMMON_CAPABILITIES,
      logo: false,
      gradient: false,
      errorCorrection: false,
      humanReadableText: true,
      quietZone: true,
    },
  },
  {
    id: "datamatrix",
    label: "Data Matrix",
    aliases: ["data-matrix"],
    family: "matrix",
    tier: "curated",
    availability: "live",
    summary: "Compact two-dimensional code used in product and industrial workflows.",
    capabilities: {
      ...COMMON_CAPABILITIES,
      logo: false,
      gradient: false,
      errorCorrection: false,
      humanReadableText: false,
      quietZone: true,
    },
  },
]);
