import type { BarcodeSymbologyId } from "@/core/code/symbology";
import type { QrHexColor } from "@/core/design/qr-design";

export type QrArtifactDecodeRequest = Readonly<{
  svg: string;
  pixelSize: number;
  backgroundColor?: QrHexColor;
}>;

export interface QrArtifactDecoder {
  readonly id: string;
  decodeSvg(request: QrArtifactDecodeRequest): Promise<string>;
}

export type BarcodeArtifactDecodeRequest = Readonly<{
  svg: string;
  width: number;
  height: number;
  symbology: BarcodeSymbologyId;
}>;

export interface BarcodeArtifactDecoder {
  readonly id: string;
  decodeSvg(request: BarcodeArtifactDecodeRequest): Promise<string>;
}

export type ArtifactSelfTestResult = Readonly<
  | { status: "passed"; decoderId: string }
  | {
      status: "failed";
      decoderId: string;
      reason: "decode-failed" | "payload-mismatch";
    }
>;

export type QrSelfTestResult = ArtifactSelfTestResult;
export type BarcodeSelfTestResult = ArtifactSelfTestResult;
