import type {
  Binarizer as ZxingBinarizer,
  DecodeHintType as ZxingDecodeHintType,
} from "@zxing/library";

import type { BarcodeSymbologyId } from "@/core/code/symbology";

import type {
  BarcodeArtifactDecodeRequest,
  BarcodeArtifactDecoder,
} from "@/core/quality/self-test";
import { rasterizeSvgForZxing } from "@/engines/decode/zxing/zxing-artifact-raster";

const FORMAT_BY_SYMBOLOGY: Readonly<Partial<Record<BarcodeSymbologyId, string>>> = Object.freeze({
  code128: "CODE_128",
  code39: "CODE_39",
  code93: "CODE_93",
  itf: "ITF",
  itf14: "ITF",
  ean13: "EAN_13",
  ean8: "EAN_8",
  upca: "UPC_A",
  upce: "UPC_E",
  datamatrix: "DATA_MATRIX",
  pdf417: "PDF_417",
  aztec: "AZTEC",
});

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
      GlobalHistogramBinarizer,
      HybridBinarizer,
      MultiFormatReader,
      NotFoundException,
      RGBLuminanceSource,
    } = await import("@zxing/library");

    const formatName = FORMAT_BY_SYMBOLOGY[request.symbology];
    if (!formatName) {
      throw new Error(`Independent artifact decoding is not available for ${request.symbology}.`);
    }
    const format = BarcodeFormat[formatName as keyof typeof BarcodeFormat];
    const hints = new Map<ZxingDecodeHintType, unknown>([
      [DecodeHintType.POSSIBLE_FORMATS, [format]],
      [DecodeHintType.TRY_HARDER, true],
    ]);
    const decodeWith = (binarizer: ZxingBinarizer): string => {
      const reader = new MultiFormatReader();
      reader.setHints(hints);
      return reader.decode(new BinaryBitmap(binarizer)).getText();
    };
    const createSource = () => new RGBLuminanceSource(frame.luminance, frame.width, frame.height);

    try {
      return decodeWith(new HybridBinarizer(createSource()));
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      return decodeWith(new GlobalHistogramBinarizer(createSource()));
    }
  }
}

export const zxingBarcodeArtifactDecoder = new ZxingBarcodeArtifactDecoder();
