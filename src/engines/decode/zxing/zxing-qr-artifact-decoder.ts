import type { DecodeHintType as ZxingDecodeHintType } from "@zxing/library";

import type { QrArtifactDecodeRequest, QrArtifactDecoder } from "@/core/quality/self-test";
import { rasterizeSvgForZxing } from "@/engines/decode/zxing/zxing-artifact-raster";

export class ZxingQrArtifactDecoder implements QrArtifactDecoder {
  readonly id = "zxing-qr";

  async decodeSvg(request: QrArtifactDecodeRequest): Promise<string> {
    const frame = await rasterizeSvgForZxing({
      svg: request.svg,
      width: request.pixelSize,
      height: request.pixelSize,
      backgroundColor: request.backgroundColor,
    });
    const { BinaryBitmap, DecodeHintType, HybridBinarizer, QRCodeReader, RGBLuminanceSource } =
      await import("@zxing/library");

    const decode = (hints: Map<ZxingDecodeHintType, unknown>) => {
      const source = new RGBLuminanceSource(frame.luminance, frame.width, frame.height);
      const bitmap = new BinaryBitmap(new HybridBinarizer(source));
      return new QRCodeReader().decode(bitmap, hints).getText();
    };

    try {
      return decode(new Map([[DecodeHintType.TRY_HARDER, true]]));
    } catch {
      return decode(new Map([[DecodeHintType.PURE_BARCODE, true]]));
    }
  }
}

export const zxingQrArtifactDecoder = new ZxingQrArtifactDecoder();
