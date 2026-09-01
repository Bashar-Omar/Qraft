import {
  code128,
  code39,
  code93,
  datamatrix,
  drawingSVG,
  ean13,
  ean8,
  interleaved2of5,
  itf14,
  upca,
  upce,
} from "@bwip-js/browser";

import type {
  BwipEncoderId,
  BwipSvgOptions,
  BwipSvgRuntime,
} from "@/engines/render/bwip/bwip-contract";

type BwipNamedEncoder = (options: BwipSvgOptions, drawing: ReturnType<typeof drawingSVG>) => string;

/**
 * The only source file allowed to know @bwip-js/browser's concrete API.
 * Named encoders preserve tree-shaking and keep the generic 100+ catalog out
 * of Qraft core/application/UI code.
 */
const BWIP_ENCODERS: Readonly<Record<BwipEncoderId, BwipNamedEncoder>> = Object.freeze({
  code128,
  code39,
  code93,
  itf: interleaved2of5,
  itf14,
  ean13,
  ean8,
  upca,
  upce,
  datamatrix,
});

export const bwipBrowserRuntime: BwipSvgRuntime = {
  render(symbology, options): string {
    return BWIP_ENCODERS[symbology](options, drawingSVG());
  },
};
