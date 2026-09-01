/**
 * Qraft-owned symbology identifiers.
 *
 * Keep vendor encoder names out of core. Adapters translate these stable IDs
 * to whichever rendering engine they use.
 */
export type SymbologyId =
  | "qr"
  | "code128"
  | "code39"
  | "code93"
  | "itf"
  | "itf14"
  | "ean13"
  | "ean8"
  | "upca"
  | "upce"
  | "datamatrix";
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

const LINEAR_CAPABILITIES: RenderCapabilities = Object.freeze({
  ...COMMON_CAPABILITIES,
  logo: false,
  gradient: false,
  errorCorrection: false,
  humanReadableText: true,
  quietZone: true,
});

/**
 * Curated formats become Live only after Qraft owns their validation contract,
 * vendor mapping and independent artifact verification path.
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
    capabilities: LINEAR_CAPABILITIES,
  },
  {
    id: "code39",
    label: "Code 39",
    aliases: ["code-39", "code3of9"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Widely compatible uppercase alphanumeric barcode for industrial identifiers.",
    capabilities: LINEAR_CAPABILITIES,
  },
  {
    id: "code93",
    label: "Code 93",
    aliases: ["code-93"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Compact uppercase alphanumeric linear barcode with built-in checksums.",
    capabilities: LINEAR_CAPABILITIES,
  },
  {
    id: "itf",
    label: "Interleaved 2 of 5",
    aliases: ["itf", "interleaved-2-of-5", "i2of5"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Dense numeric-only linear barcode encoded as digit pairs.",
    capabilities: LINEAR_CAPABILITIES,
  },
  {
    id: "itf14",
    label: "ITF-14",
    aliases: ["itf-14"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "GTIN-14 shipping-container barcode with strict check-digit validation.",
    capabilities: LINEAR_CAPABILITIES,
  },
  {
    id: "ean13",
    label: "EAN-13",
    aliases: ["ean-13", "gtin-13"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Retail GTIN-13 barcode with Qraft-owned check-digit validation.",
    capabilities: LINEAR_CAPABILITIES,
  },
  {
    id: "ean8",
    label: "EAN-8",
    aliases: ["ean-8", "gtin-8"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Compact retail GTIN-8 barcode for small packaging.",
    capabilities: LINEAR_CAPABILITIES,
  },
  {
    id: "upca",
    label: "UPC-A",
    aliases: ["upc-a", "gtin-12"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Retail GTIN-12 barcode with strict numeric and check-digit validation.",
    capabilities: LINEAR_CAPABILITIES,
  },
  {
    id: "upce",
    label: "UPC-E",
    aliases: ["upc-e", "upc-e0"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Zero-compressed UPC-E0 retail barcode for small packaging.",
    capabilities: LINEAR_CAPABILITIES,
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
