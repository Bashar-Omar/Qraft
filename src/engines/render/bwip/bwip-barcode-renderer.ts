import { BwipBarcodeAdapter } from "@/engines/render/bwip/bwip-barcode-adapter";
import { bwipBrowserRuntime } from "@/engines/render/bwip/bwip-browser-runtime";

export const bwipBarcodeRenderer = new BwipBarcodeAdapter(bwipBrowserRuntime);
