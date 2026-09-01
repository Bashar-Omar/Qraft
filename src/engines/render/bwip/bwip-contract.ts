import type { BarcodeSymbologyId, SymbologyId } from "@/core/code/symbology";

export type BwipEncoderId = Extract<BarcodeSymbologyId, "code128" | "datamatrix">;

export const BWIP_ENCODER_IDS = Object.freeze(["code128", "datamatrix"] as const);

export function isBwipEncoderId(symbology: SymbologyId): symbology is BwipEncoderId {
  return (BWIP_ENCODER_IDS as readonly SymbologyId[]).includes(symbology);
}

/**
 * Minimal vendor-local option surface Qraft is willing to send to BWIP.
 * Keep the upstream package's broad option type inside this adapter folder.
 */
export type BwipSvgOptions = Readonly<{
  bcid: BwipEncoderId;
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
}>;

export interface BwipSvgRuntime {
  render(symbology: BwipEncoderId, options: BwipSvgOptions): string;
}
