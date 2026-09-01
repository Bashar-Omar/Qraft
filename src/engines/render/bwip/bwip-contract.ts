import type { BarcodeSymbologyId, SymbologyId } from "@/core/code/symbology";

export type BwipEncoderId = Extract<
  BarcodeSymbologyId,
  | "code128"
  | "code39"
  | "code93"
  | "itf"
  | "itf14"
  | "ean13"
  | "ean8"
  | "upca"
  | "upce"
  | "datamatrix"
  | "pdf417"
  | "aztec"
  | "codabar"
  | "code11"
  | "msi"
  | "plessey"
  | "microqr"
  | "maxicode"
  | "rmqr"
>;

export const BWIP_ENCODER_IDS = Object.freeze([
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
  "codabar",
  "code11",
  "msi",
  "plessey",
  "microqr",
  "maxicode",
  "rmqr",
] as const satisfies readonly BwipEncoderId[]);

export function isBwipEncoderId(symbology: SymbologyId): symbology is BwipEncoderId {
  return (BWIP_ENCODER_IDS as readonly SymbologyId[]).includes(symbology);
}

/**
 * Minimal vendor-local option surface Qraft is willing to send to BWIP.
 * Keep the upstream package's broad option type inside this adapter folder.
 */
export type BwipSvgOptions = Readonly<{
  bcid: string;
  text: string;
  binarytext: true;
  scale: 1;
  backgroundcolor: "ffffff";
  height?: number;
  includetext?: boolean;
  textxalign?: "center";
  padding?: number;
  paddingwidth?: number;
  paddingheight?: number;
  guardwhitespace?: boolean;
  eclevel?: "L" | "M";
  fixedeclevel?: true;
  version?: "R17x139";
}>;

export interface BwipSvgRuntime {
  render(symbology: BwipEncoderId, options: BwipSvgOptions): string;
}
