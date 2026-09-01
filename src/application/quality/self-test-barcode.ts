import type { RenderedBarcodeCode } from "@/core/code/render";
import type { BarcodeArtifactDecoder, BarcodeSelfTestResult } from "@/core/quality/self-test";

const MAX_SELF_TEST_SIDE = 1400;
const TARGET_SCALE = 8;

export type SelfTestBarcodeRequest = Readonly<{
  rendered: RenderedBarcodeCode;
  expectedPayload: string;
}>;

function resolveSelfTestDimensions(
  rendered: RenderedBarcodeCode,
): Readonly<{ width: number; height: number }> {
  const longestSide = Math.max(rendered.width, rendered.height);
  const scale = Math.max(1, Math.min(TARGET_SCALE, Math.floor(MAX_SELF_TEST_SIDE / longestSide)));
  return {
    width: Math.max(1, Math.round(rendered.width * scale)),
    height: Math.max(1, Math.round(rendered.height * scale)),
  };
}

export function createSelfTestBarcode(decoder: BarcodeArtifactDecoder) {
  return async function selfTestBarcode(
    request: SelfTestBarcodeRequest,
  ): Promise<BarcodeSelfTestResult> {
    const dimensions = resolveSelfTestDimensions(request.rendered);
    try {
      const decoded = await decoder.decodeSvg({
        svg: request.rendered.svg,
        width: dimensions.width,
        height: dimensions.height,
        symbology: request.rendered.metadata.symbology,
      });
      if (decoded !== request.expectedPayload) {
        return { status: "failed", decoderId: decoder.id, reason: "payload-mismatch" };
      }
      return { status: "passed", decoderId: decoder.id };
    } catch {
      return { status: "failed", decoderId: decoder.id, reason: "decode-failed" };
    }
  };
}
