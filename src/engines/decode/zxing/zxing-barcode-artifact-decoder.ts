import type { DecodeHintType as ZxingDecodeHintType } from "@zxing/library";

import type {
  BarcodeArtifactDecodeRequest,
  BarcodeArtifactDecoder,
} from "@/core/quality/self-test";
import { rasterizeSvgForZxing } from "@/engines/decode/zxing/zxing-artifact-raster";

const FORMAT_BY_SYMBOLOGY = Object.freeze({
  code128: "CODE_128",
  datamatrix: "DATA_MATRIX",
} as const);

export class ZxingBarcodeArtifactDecoder implements BarcodeArtifactDecoder {
  readonly id = "zxing-barcode";

  async decodeSvg(request: BarcodeArtifactDecodeRequest): Promise<string> {
    const frame = await rasterizeSvgForZxing({
      svg: request.svg,
      width: request.width,
      height: request.height,
      backgroundColor: "#ffffff",
    });
    const {
      BarcodeFormat,
      BinaryBitmap,
      DecodeHintType,
      HybridBinarizer,
      MultiFormatReader,
      RGBLuminanceSource,
    } = await import("@zxing/library");

    const format = BarcodeFormat[FORMAT_BY_SYMBOLOGY[request.symbology]];
    const source = new RGBLuminanceSource(frame.luminance, frame.width, frame.height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const reader = new MultiFormatReader();
    reader.setHints(
      new Map<ZxingDecodeHintType, unknown>([
        [DecodeHintType.POSSIBLE_FORMATS, [format]],
        [DecodeHintType.TRY_HARDER, true],
      ]),
    );
    return reader.decode(bitmap).getText();
  }
}

export const zxingBarcodeArtifactDecoder = new ZxingBarcodeArtifactDecoder();
