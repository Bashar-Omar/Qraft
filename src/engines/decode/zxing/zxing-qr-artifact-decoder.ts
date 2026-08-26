import type { QrArtifactDecodeRequest, QrArtifactDecoder } from "@/core/quality/self-test";

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const source = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(source);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The browser could not rasterize the generated QR artifact."));
    };
    image.src = url;
  });
}

function rgbaToLuminance(imageData: ImageData): Uint8ClampedArray {
  const pixels = imageData.data;
  const luminance = new Uint8ClampedArray(imageData.width * imageData.height);

  for (let pixelIndex = 0, sourceIndex = 0; pixelIndex < luminance.length; pixelIndex += 1) {
    const red = pixels[sourceIndex] ?? 0;
    const green = pixels[sourceIndex + 1] ?? 0;
    const blue = pixels[sourceIndex + 2] ?? 0;
    luminance[pixelIndex] = Math.round((red + green * 2 + blue) / 4);
    sourceIndex += 4;
  }

  return luminance;
}

async function rasterize(request: QrArtifactDecodeRequest): Promise<
  Readonly<{
    luminance: Uint8ClampedArray;
    width: number;
    height: number;
  }>
> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas 2D is unavailable for the local QR self-test.");
  }

  canvas.width = request.pixelSize;
  canvas.height = request.pixelSize;

  if (request.backgroundColor) {
    context.fillStyle = request.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  const image = await loadSvgImage(request.svg);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

  return {
    luminance: rgbaToLuminance(imageData),
    width: canvas.width,
    height: canvas.height,
  };
}

export class ZxingQrArtifactDecoder implements QrArtifactDecoder {
  readonly id = "zxing-qr";

  async decodeSvg(request: QrArtifactDecodeRequest): Promise<string> {
    if (
      typeof document === "undefined" ||
      typeof Image === "undefined" ||
      typeof Blob === "undefined" ||
      typeof URL === "undefined"
    ) {
      throw new Error("Local QR self-test requires a browser environment.");
    }

    const frame = await rasterize(request);
    const { BinaryBitmap, DecodeHintType, HybridBinarizer, QRCodeReader, RGBLuminanceSource } =
      await import("@zxing/library");
    const source = new RGBLuminanceSource(frame.luminance, frame.width, frame.height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const hints = new Map([[DecodeHintType.TRY_HARDER, true]]);
    const result = new QRCodeReader().decode(bitmap, hints);

    return result.getText();
  }
}

export const zxingQrArtifactDecoder = new ZxingQrArtifactDecoder();
