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
  | "codabar"
  | "code11"
  | "msi"
  | "plessey"
  | "datamatrix"
  | "pdf417"
  | "aztec"
  | "microqr"
  | "maxicode"
  | "rmqr";
export type BarcodeSymbologyId = Exclude<SymbologyId, "qr">;

export const BARCODE_SYMBOLOGY_IDS = Object.freeze([
  "code128",
  "code39",
  "code93",
  "itf",
  "itf14",
  "ean13",
  "ean8",
  "upca",
  "upce",
  "codabar",
  "code11",
  "msi",
  "plessey",
  "datamatrix",
  "pdf417",
  "aztec",
  "microqr",
  "maxicode",
  "rmqr",
] as const satisfies readonly BarcodeSymbologyId[]);

export type SymbologyFamily = "matrix" | "linear" | "stacked";
export type SymbologyTier = "curated" | "expert" | "experimental";
export type SymbologyAvailability = "live" | "planned";
export type SymbologyDomain =
  | "general"
  | "retail"
  | "industrial"
  | "logistics"
  | "documents"
  | "mobile"
  | "healthcare"
  | "postal";
export type ArtifactVerificationLevel = "independent" | "renderer-only";

export type SymbologyCatalogMetadata = Readonly<{
  domains: readonly SymbologyDomain[];
  keywords: readonly string[];
}>;

export type SymbologyVerification = Readonly<{
  artifactSelfTest: ArtifactVerificationLevel;
  note: string;
}>;

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
  catalog: SymbologyCatalogMetadata;
  capabilities: RenderCapabilities;
  verification: SymbologyVerification;
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

const NON_STYLED_2D_CAPABILITIES: RenderCapabilities = Object.freeze({
  ...COMMON_CAPABILITIES,
  logo: false,
  gradient: false,
  errorCorrection: false,
  humanReadableText: false,
  quietZone: true,
});

const INDEPENDENT_VERIFICATION: SymbologyVerification = Object.freeze({
  artifactSelfTest: "independent",
  note: "Final SVG can be independently rasterized and decoded locally through Qraft's ZXing adapter.",
});

const RENDERER_ONLY_VERIFICATION: SymbologyVerification = Object.freeze({
  artifactSelfTest: "renderer-only",
  note: "Qraft validates input and the final SVG boundary, but the bundled independent decoder does not cover this format.",
});

/**
 * Product support is intentionally narrower than BWIP's encoder catalog.
 * Curated = first-class workflow, Expert = allow-listed advanced workflow,
 * Experimental = deliberate opt-in while verification coverage is incomplete.
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
    catalog: { domains: ["general", "mobile"], keywords: ["url", "wifi", "contact", "marketing"] },
    capabilities: {
      ...COMMON_CAPABILITIES,
      logo: true,
      gradient: true,
      errorCorrection: true,
      humanReadableText: false,
      quietZone: true,
    },
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "code128",
    label: "Code 128",
    aliases: ["code-128"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Dense general-purpose linear barcode for text and identifiers.",
    catalog: {
      domains: ["general", "industrial", "logistics"],
      keywords: ["inventory", "asset", "identifier"],
    },
    capabilities: LINEAR_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "code39",
    label: "Code 39",
    aliases: ["code-39", "code3of9"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Widely compatible uppercase alphanumeric barcode for industrial identifiers.",
    catalog: {
      domains: ["industrial", "logistics"],
      keywords: ["inventory", "asset", "automotive"],
    },
    capabilities: LINEAR_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "code93",
    label: "Code 93",
    aliases: ["code-93"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Compact uppercase alphanumeric linear barcode with built-in checksums.",
    catalog: {
      domains: ["industrial", "logistics"],
      keywords: ["inventory", "identifier", "compact"],
    },
    capabilities: LINEAR_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "itf",
    label: "Interleaved 2 of 5",
    aliases: ["itf", "interleaved-2-of-5", "i2of5"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Dense numeric-only linear barcode encoded as digit pairs.",
    catalog: { domains: ["industrial", "logistics"], keywords: ["numeric", "warehouse", "carton"] },
    capabilities: LINEAR_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "itf14",
    label: "ITF-14",
    aliases: ["itf-14"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "GTIN-14 shipping-container barcode with strict check-digit validation.",
    catalog: { domains: ["retail", "logistics"], keywords: ["gtin", "carton", "shipping", "case"] },
    capabilities: LINEAR_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "ean13",
    label: "EAN-13",
    aliases: ["ean-13", "gtin-13"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Retail GTIN-13 barcode with Qraft-owned check-digit validation.",
    catalog: { domains: ["retail"], keywords: ["gtin", "product", "checkout", "pos"] },
    capabilities: LINEAR_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "ean8",
    label: "EAN-8",
    aliases: ["ean-8", "gtin-8"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Compact retail GTIN-8 barcode for small packaging.",
    catalog: { domains: ["retail"], keywords: ["gtin", "product", "small packaging", "pos"] },
    capabilities: LINEAR_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "upca",
    label: "UPC-A",
    aliases: ["upc-a", "gtin-12"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Retail GTIN-12 barcode with strict numeric and check-digit validation.",
    catalog: { domains: ["retail"], keywords: ["gtin", "product", "checkout", "north america"] },
    capabilities: LINEAR_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "upce",
    label: "UPC-E",
    aliases: ["upc-e", "upc-e0"],
    family: "linear",
    tier: "curated",
    availability: "live",
    summary: "Zero-compressed UPC-E0 retail barcode for small packaging.",
    catalog: {
      domains: ["retail"],
      keywords: ["gtin", "product", "compressed", "small packaging"],
    },
    capabilities: LINEAR_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "codabar",
    label: "Codabar",
    aliases: ["rationalized-codabar", "nw-7", "usd-4"],
    family: "linear",
    tier: "expert",
    availability: "live",
    summary:
      "Legacy self-checking linear format used in libraries, laboratories and blood-bank workflows.",
    catalog: {
      domains: ["healthcare", "industrial"],
      keywords: ["library", "laboratory", "blood bank", "legacy"],
    },
    capabilities: LINEAR_CAPABILITIES,
    verification: RENDERER_ONLY_VERIFICATION,
  },
  {
    id: "code11",
    label: "Code 11",
    aliases: ["code-11", "usd-8"],
    family: "linear",
    tier: "expert",
    availability: "live",
    summary:
      "Numeric-and-hyphen legacy linear symbology originally designed for telecommunications.",
    catalog: { domains: ["industrial"], keywords: ["telecom", "numeric", "legacy"] },
    capabilities: LINEAR_CAPABILITIES,
    verification: RENDERER_ONLY_VERIFICATION,
  },
  {
    id: "msi",
    label: "MSI Plessey",
    aliases: ["msi", "modified-plessey"],
    family: "linear",
    tier: "expert",
    availability: "live",
    summary: "Numeric inventory barcode retained for legacy warehouse and retail systems.",
    catalog: {
      domains: ["industrial", "retail"],
      keywords: ["inventory", "warehouse", "legacy", "numeric"],
    },
    capabilities: LINEAR_CAPABILITIES,
    verification: RENDERER_ONLY_VERIFICATION,
  },
  {
    id: "plessey",
    label: "Plessey",
    aliases: ["plessey-uk", "anker-code"],
    family: "linear",
    tier: "expert",
    availability: "live",
    summary: "Legacy hexadecimal linear barcode used by older inventory systems.",
    catalog: { domains: ["industrial"], keywords: ["hexadecimal", "inventory", "legacy"] },
    capabilities: LINEAR_CAPABILITIES,
    verification: RENDERER_ONLY_VERIFICATION,
  },
  {
    id: "datamatrix",
    label: "Data Matrix",
    aliases: ["data-matrix"],
    family: "matrix",
    tier: "curated",
    availability: "live",
    summary: "Compact two-dimensional code used in product and industrial workflows.",
    catalog: {
      domains: ["industrial", "retail", "logistics"],
      keywords: ["2d", "parts", "traceability", "marking"],
    },
    capabilities: NON_STYLED_2D_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "pdf417",
    label: "PDF417",
    aliases: ["pdf-417"],
    family: "stacked",
    tier: "curated",
    availability: "live",
    summary: "High-capacity stacked barcode for documents, credentials and transport workflows.",
    catalog: {
      domains: ["documents", "logistics"],
      keywords: ["2d", "credential", "license", "manifest", "transport"],
    },
    capabilities: NON_STYLED_2D_CAPABILITIES,
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "aztec",
    label: "Aztec Code",
    aliases: ["aztec", "aztec-code"],
    family: "matrix",
    tier: "curated",
    availability: "live",
    summary: "Compact orientation-independent 2D code suited to mobile tickets and transport data.",
    catalog: {
      domains: ["mobile", "documents", "logistics"],
      keywords: ["2d", "ticket", "boarding pass", "transport"],
    },
    capabilities: {
      ...NON_STYLED_2D_CAPABILITIES,
      quietZone: false,
    },
    verification: INDEPENDENT_VERIFICATION,
  },
  {
    id: "microqr",
    label: "Micro QR",
    aliases: ["micro-qr", "microqrcode"],
    family: "matrix",
    tier: "expert",
    availability: "live",
    summary: "Small QR-family symbol for compact labels where regular QR is physically wasteful.",
    catalog: {
      domains: ["industrial", "mobile"],
      keywords: ["compact", "small label", "qr variant", "m1", "m4"],
    },
    capabilities: NON_STYLED_2D_CAPABILITIES,
    verification: RENDERER_ONLY_VERIFICATION,
  },
  {
    id: "maxicode",
    label: "MaxiCode",
    aliases: ["maxi-code", "ups-code", "code-6"],
    family: "matrix",
    tier: "expert",
    availability: "live",
    summary: "Fixed-size hexagonal 2D code used in parcel logistics and carrier workflows.",
    catalog: {
      domains: ["logistics"],
      keywords: ["ups", "parcel", "shipping", "carrier", "bullseye"],
    },
    capabilities: {
      ...NON_STYLED_2D_CAPABILITIES,
      quietZone: false,
    },
    verification: RENDERER_ONLY_VERIFICATION,
  },
  {
    id: "rmqr",
    label: "rMQR",
    aliases: ["rmqr", "rectangular-micro-qr", "rectangularmicroqrcode"],
    family: "matrix",
    tier: "experimental",
    availability: "live",
    summary:
      "Rectangular QR-family symbol for narrow spaces; rendering is available while independent decode coverage remains gated.",
    catalog: {
      domains: ["industrial", "logistics"],
      keywords: ["rectangular", "narrow", "qr variant", "compact"],
    },
    capabilities: NON_STYLED_2D_CAPABILITIES,
    verification: RENDERER_ONLY_VERIFICATION,
  },
]);
