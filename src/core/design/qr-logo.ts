export type QraftQrLogoConfig = Readonly<{
  /** Width of the centered clearance area as a percentage of the QR symbol, excluding quiet zone. */
  sizePercent: number;
  /** Transparent breathing room kept inside the cleared logo area. */
  paddingModules: number;
}>;

export const QR_LOGO_LIMITS = Object.freeze({
  maxFileBytes: 4 * 1024 * 1024,
  maxSourceDimension: 4096,
  maxSourcePixels: 16_777_216,
  normalizedMinDimension: 256,
  normalizedMaxDimension: 1024,
  minSizePercent: 16,
  maxSizePercent: 26,
  maxPaddingModules: 1,
  paddingStepModules: 0.5,
});

export const DEFAULT_QR_LOGO_CONFIG: QraftQrLogoConfig = Object.freeze({
  sizePercent: 20,
  paddingModules: 0.5,
});

export class QrLogoConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QrLogoConfigValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseQrLogoConfig(value: unknown): QraftQrLogoConfig {
  if (!isRecord(value)) {
    throw new QrLogoConfigValidationError("Logo configuration must be an object.");
  }

  const sizePercent = value.sizePercent;
  const paddingModules = value.paddingModules;

  if (
    typeof sizePercent !== "number" ||
    !Number.isInteger(sizePercent) ||
    sizePercent < QR_LOGO_LIMITS.minSizePercent ||
    sizePercent > QR_LOGO_LIMITS.maxSizePercent
  ) {
    throw new QrLogoConfigValidationError(
      `Logo size must be an integer between ${QR_LOGO_LIMITS.minSizePercent}% and ${QR_LOGO_LIMITS.maxSizePercent}%.`,
    );
  }

  if (
    typeof paddingModules !== "number" ||
    !Number.isFinite(paddingModules) ||
    paddingModules < 0 ||
    paddingModules > QR_LOGO_LIMITS.maxPaddingModules ||
    Math.abs(
      paddingModules / QR_LOGO_LIMITS.paddingStepModules -
        Math.round(paddingModules / QR_LOGO_LIMITS.paddingStepModules),
    ) >
      Number.EPSILON * 10
  ) {
    throw new QrLogoConfigValidationError(
      `Logo padding must be between 0 and ${QR_LOGO_LIMITS.maxPaddingModules} modules in ${QR_LOGO_LIMITS.paddingStepModules}-module steps.`,
    );
  }

  return { sizePercent, paddingModules };
}

export type QrLogoGeometryEstimate = Readonly<{
  areaSidePercent: number;
  estimatedCenterCoveragePercent: number;
  estimatedCoveredModules: number;
  paddingModules: number;
}>;

export function estimateQrLogoGeometry(
  config: QraftQrLogoConfig,
  symbolModules: number,
): QrLogoGeometryEstimate {
  const normalized = parseQrLogoConfig(config);
  const sideRatio = normalized.sizePercent / 100;
  const sideModules = symbolModules * sideRatio;
  // Derive the percentage from the integer percent directly instead of
  // squaring the binary floating-point ratio (for example 0.2 * 0.2 * 100),
  // which can surface as 4.000000000000001 in deterministic quality metrics.
  const estimatedCenterCoveragePercent = (normalized.sizePercent * normalized.sizePercent) / 100;

  return {
    areaSidePercent: normalized.sizePercent,
    estimatedCenterCoveragePercent,
    estimatedCoveredModules: sideModules * sideModules,
    paddingModules: normalized.paddingModules,
  };
}
