import type { RenderedCode } from "@/core/code/render";
import type { QraftQrDesign } from "@/core/design/qr-design";
import type { QrArtifactDecoder, QrSelfTestResult } from "@/core/quality/self-test";

const MAX_SELF_TEST_SIZE = 1024;
const TARGET_SELF_TEST_PIXELS_PER_MODULE = 16;
const MIN_SELF_TEST_PIXELS_PER_MODULE = 4;

export type SelfTestQrRequest = Readonly<{
  rendered: RenderedCode;
  design: QraftQrDesign;
  expectedPayload: string;
}>;

export function createSelfTestQr(decoder: QrArtifactDecoder) {
  return async function selfTestQr(request: SelfTestQrRequest): Promise<QrSelfTestResult> {
    const totalModules = request.rendered.metadata.totalModules;
    const pixelsPerModule = Math.max(
      MIN_SELF_TEST_PIXELS_PER_MODULE,
      Math.min(TARGET_SELF_TEST_PIXELS_PER_MODULE, Math.floor(MAX_SELF_TEST_SIZE / totalModules)),
    );
    const pixelSize = totalModules * pixelsPerModule;

    try {
      const decoded = await decoder.decodeSvg({
        svg: request.rendered.svg,
        pixelSize,
        backgroundColor: request.design.background.kind === "transparent" ? "#ffffff" : undefined,
      });

      if (decoded !== request.expectedPayload) {
        return {
          status: "failed",
          decoderId: decoder.id,
          reason: "payload-mismatch",
        };
      }

      return {
        status: "passed",
        decoderId: decoder.id,
      };
    } catch {
      return {
        status: "failed",
        decoderId: decoder.id,
        reason: "decode-failed",
      };
    }
  };
}
