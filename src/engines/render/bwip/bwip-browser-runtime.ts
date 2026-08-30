import { code128, datamatrix, drawingSVG } from "@bwip-js/browser";

import type {
  BwipEncoderId,
  BwipSvgOptions,
  BwipSvgRuntime,
} from "@/engines/render/bwip/bwip-contract";

type BwipNamedEncoder = (
  options: BwipSvgOptions,
  drawing: ReturnType<typeof drawingSVG>,
) => string;

/**
 * The only source file allowed to know @bwip-js/browser's concrete API.
 * Named encoders keep Code 128/Data Matrix explicit and let the bundler avoid
 * treating Qraft's initial barcode slice as a request for the full 100+ catalog.
 */
const BWIP_ENCODERS: Readonly<Record<BwipEncoderId, BwipNamedEncoder>> = Object.freeze({
  code128,
  datamatrix,
});

export const bwipBrowserRuntime: BwipSvgRuntime = {
  render(symbology, options): string {
    return BWIP_ENCODERS[symbology](options, drawingSVG());
  },
};
