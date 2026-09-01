import type { RenderedCode } from "@/core/code/render";
import { resolveRasterDimensions } from "@/core/export/raster";

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
      reject(new Error("The browser could not rasterize the generated SVG."));
    };
    image.src = url;
  });
}

export async function rasterizeRenderedSvg(
  rendered: RenderedCode,
  requestedSize?: number,
  solidBackground?: string,
): Promise<Readonly<{ canvas: HTMLCanvasElement; pixelWidth: number; pixelHeight: number }>> {
  if (
    typeof document === "undefined" ||
    typeof Image === "undefined" ||
    typeof URL === "undefined"
  ) {
    throw new Error("Raster export requires a browser canvas environment.");
  }

  const { width: pixelWidth, height: pixelHeight } = resolveRasterDimensions(
    rendered,
    requestedSize,
  );
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D is not available in this browser.");
  }

  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  context.clearRect(0, 0, pixelWidth, pixelHeight);

  if (solidBackground) {
    context.fillStyle = solidBackground;
    context.fillRect(0, 0, pixelWidth, pixelHeight);
  }

  const image = await loadSvgImage(rendered.svg);
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, pixelWidth, pixelHeight);

  return { canvas, pixelWidth, pixelHeight };
}

export function canvasToExactBlob(
  canvas: HTMLCanvasElement,
  mimeType: "image/png" | "image/jpeg" | "image/webp",
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`The browser could not create a ${mimeType} blob.`));
          return;
        }

        if (blob.type !== mimeType) {
          reject(
            new Error(
              `This browser does not support ${mimeType} canvas export without falling back to ${blob.type || "another format"}.`,
            ),
          );
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}
