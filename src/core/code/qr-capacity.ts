import type { QrErrorCorrectionLevel } from "@/core/code/render";

/**
 * QR Code Version 40 maximum binary/byte-mode payload capacities from DENSO WAVE.
 *
 * Qraft's current QR renderers deliberately force byte mode, so these values
 * are the authoritative hard ceilings for the current QR pipeline rather than
 * a generic claim about every possible QR encoding mode.
 */
export const QR_V40_BYTE_CAPACITY: Readonly<Record<QrErrorCorrectionLevel, number>> = Object.freeze(
  {
    L: 2953,
    M: 2331,
    Q: 1663,
    H: 1273,
  },
);

export type QrByteCapacityPressure = "low" | "moderate" | "dense" | "near-limit" | "over-limit";

export type QrByteCapacityAssessment = Readonly<{
  bytes: number;
  capacity: number;
  ratio: number;
  pressure: QrByteCapacityPressure;
}>;

export function assessQrByteCapacity(
  bytes: number,
  errorCorrectionLevel: QrErrorCorrectionLevel,
): QrByteCapacityAssessment {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new Error("QR byte count must be a finite non-negative number.");
  }

  const capacity = QR_V40_BYTE_CAPACITY[errorCorrectionLevel];
  const ratio = bytes / capacity;
  const pressure: QrByteCapacityPressure =
    ratio > 1
      ? "over-limit"
      : ratio > 0.85
        ? "near-limit"
        : ratio > 0.6
          ? "dense"
          : ratio > 0.3
            ? "moderate"
            : "low";

  return {
    bytes,
    capacity,
    ratio,
    pressure,
  };
}
