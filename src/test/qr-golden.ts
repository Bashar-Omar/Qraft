import { Bitmap } from "qr";
import decodeQR from "qr/decode.js";

import type { QrMatrix } from "@/core/code/render";

const GOLDEN_DECODE_SCALE = 4;

function scaleMatrixForDecode(matrix: QrMatrix, scale: number): boolean[][] {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new Error("Decode scale must be a positive integer.");
  }

  const scaled: boolean[][] = [];

  for (const row of matrix) {
    const expandedRow = row.flatMap((module) => Array<boolean>(scale).fill(module));

    for (let index = 0; index < scale; index += 1) {
      scaled.push([...expandedRow]);
    }
  }

  return scaled;
}

export function decodeQrMatrixForGoldenTest(matrix: QrMatrix): string {
  const data = scaleMatrixForDecode(matrix, GOLDEN_DECODE_SCALE);
  const bitmap = new Bitmap({ width: data[0].length, height: data.length }, data);
  return decodeQR(bitmap.toImage());
}
