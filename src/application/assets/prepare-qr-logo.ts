import {
  QrLogoFileValidationError,
  inspectQrLogoFileBytes,
  type QrLogoFileInspection,
} from "@/core/design/qr-logo-file";
import { QR_LOGO_LIMITS } from "@/core/design/qr-logo";

export type PreparedQrLogo = Readonly<{
  blob: Blob;
  source: QrLogoFileInspection;
  normalizedDimension: number;
}>;

type LoadedLogo = Readonly<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup(): void;
}>;

async function loadWithHtmlImage(file: File): Promise<LoadedLogo> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new QrLogoFileValidationError("The browser could not decode this logo image."));
      image.src = objectUrl;
    });
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(objectUrl),
  };
}

async function loadLogo(file: File): Promise<LoadedLogo> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Safari/WebKit and malformed-image fallbacks still receive a real decode attempt below.
    }
  }

  return loadWithHtmlImage(file);
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new QrLogoFileValidationError("Qraft could not normalize this logo image."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

export async function prepareQrLogo(file: File): Promise<PreparedQrLogo> {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new QrLogoFileValidationError("Logo preparation requires a browser environment.");
  }

  if (file.size < 1 || file.size > QR_LOGO_LIMITS.maxFileBytes) {
    throw new QrLogoFileValidationError("Logo files must be between 1 byte and 4 MiB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const source = inspectQrLogoFileBytes(bytes, file.size);
  const loaded = await loadLogo(file);

  try {
    if (
      loaded.width < 1 ||
      loaded.height < 1 ||
      loaded.width > QR_LOGO_LIMITS.maxSourceDimension ||
      loaded.height > QR_LOGO_LIMITS.maxSourceDimension ||
      loaded.width * loaded.height > QR_LOGO_LIMITS.maxSourcePixels
    ) {
      throw new QrLogoFileValidationError(
        "The decoded logo dimensions exceed Qraft's safe limits.",
      );
    }

    const normalizedDimension = Math.min(
      QR_LOGO_LIMITS.normalizedMaxDimension,
      Math.max(QR_LOGO_LIMITS.normalizedMinDimension, loaded.width, loaded.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = normalizedDimension;
    canvas.height = normalizedDimension;
    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      throw new QrLogoFileValidationError(
        "The browser could not create a logo normalization canvas.",
      );
    }

    context.clearRect(0, 0, normalizedDimension, normalizedDimension);
    const scale = Math.min(normalizedDimension / loaded.width, normalizedDimension / loaded.height);
    const drawWidth = loaded.width * scale;
    const drawHeight = loaded.height * scale;
    const x = (normalizedDimension - drawWidth) / 2;
    const y = (normalizedDimension - drawHeight) / 2;
    context.drawImage(loaded.source, x, y, drawWidth, drawHeight);

    return {
      blob: await canvasToPngBlob(canvas),
      source: {
        ...source,
        width: loaded.width,
        height: loaded.height,
      },
      normalizedDimension,
    };
  } finally {
    loaded.cleanup();
  }
}
