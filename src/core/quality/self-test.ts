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

export type QrSelfTestResult = Readonly<
  | {
      status: "passed";
      decoderId: string;
    }
  | {
      status: "failed";
      decoderId: string;
      reason: "decode-failed" | "payload-mismatch";
    }
>;
