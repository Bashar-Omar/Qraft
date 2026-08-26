import { parseQrLogoConfig, type QraftQrLogoConfig } from "@/core/design/qr-logo";

export type QrHexColor = `#${string}`;

export type QrSolidPaint = Readonly<{
  kind: "solid";
  color: QrHexColor;
}>;

export type QrLinearGradientPaint = Readonly<{
  kind: "linear-gradient";
  from: QrHexColor;
  to: QrHexColor;
  rotationDegrees: number;
}>;

export type QrForegroundPaint = QrSolidPaint | QrLinearGradientPaint;

export type QrBackgroundPaint =
  | QrSolidPaint
  | Readonly<{
      kind: "transparent";
    }>;

export type QrModuleShape =
  "square" | "rounded" | "dots" | "classy" | "classy-rounded" | "extra-rounded";

export type QrEyeFrameShape = "square" | "dot" | "extra-rounded";
export type QrEyeDotShape = "square" | "dot";

export type QraftQrDesign = Readonly<{
  foreground: QrForegroundPaint;
  background: QrBackgroundPaint;
  moduleShape: QrModuleShape;
  eyeFrame: QrEyeFrameShape;
  eyeDot: QrEyeDotShape;
  quietZoneModules: number;
  logo?: QraftQrLogoConfig;
}>;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const MODULE_SHAPES = new Set<QrModuleShape>([
  "square",
  "rounded",
  "dots",
  "classy",
  "classy-rounded",
  "extra-rounded",
]);
const EYE_FRAME_SHAPES = new Set<QrEyeFrameShape>(["square", "dot", "extra-rounded"]);
const EYE_DOT_SHAPES = new Set<QrEyeDotShape>(["square", "dot"]);

export const DEFAULT_QR_DESIGN: QraftQrDesign = Object.freeze({
  foreground: Object.freeze({ kind: "solid", color: "#000000" }),
  background: Object.freeze({ kind: "solid", color: "#ffffff" }),
  moduleShape: "square",
  eyeFrame: "square",
  eyeDot: "square",
  quietZoneModules: 4,
});

export class QrDesignValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QrDesignValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeHexColor(value: unknown, field: string): QrHexColor {
  if (typeof value !== "string" || !HEX_COLOR.test(value)) {
    throw new QrDesignValidationError(`${field} must be a six-digit hex color.`);
  }

  return value.toLowerCase() as QrHexColor;
}

function normalizeRotation(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new QrDesignValidationError("Gradient rotation must be a finite number.");
  }

  return ((Math.round(value) % 360) + 360) % 360;
}

function parseForeground(value: unknown): QrForegroundPaint {
  if (!isRecord(value) || typeof value.kind !== "string") {
    throw new QrDesignValidationError("Foreground paint is invalid.");
  }

  if (value.kind === "solid") {
    return {
      kind: "solid",
      color: normalizeHexColor(value.color, "Foreground color"),
    };
  }

  if (value.kind === "linear-gradient") {
    return {
      kind: "linear-gradient",
      from: normalizeHexColor(value.from, "Gradient start color"),
      to: normalizeHexColor(value.to, "Gradient end color"),
      rotationDegrees: normalizeRotation(value.rotationDegrees),
    };
  }

  throw new QrDesignValidationError("Unsupported foreground paint type.");
}

function parseBackground(value: unknown): QrBackgroundPaint {
  if (!isRecord(value) || typeof value.kind !== "string") {
    throw new QrDesignValidationError("Background paint is invalid.");
  }

  if (value.kind === "transparent") {
    return { kind: "transparent" };
  }

  if (value.kind === "solid") {
    return {
      kind: "solid",
      color: normalizeHexColor(value.color, "Background color"),
    };
  }

  throw new QrDesignValidationError("Unsupported background paint type.");
}

function parseQuietZone(value: unknown): number {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 4 || value > 16) {
    throw new QrDesignValidationError("QR quiet zone must be an integer between 4 and 16 modules.");
  }

  return value;
}

export function parseQrDesign(value: unknown): QraftQrDesign {
  if (!isRecord(value)) {
    throw new QrDesignValidationError("QR design must be an object.");
  }

  const moduleShape = value.moduleShape;
  const eyeFrame = value.eyeFrame;
  const eyeDot = value.eyeDot;

  if (typeof moduleShape !== "string" || !MODULE_SHAPES.has(moduleShape as QrModuleShape)) {
    throw new QrDesignValidationError("Unsupported module shape.");
  }

  if (typeof eyeFrame !== "string" || !EYE_FRAME_SHAPES.has(eyeFrame as QrEyeFrameShape)) {
    throw new QrDesignValidationError("Unsupported eye-frame shape.");
  }

  if (typeof eyeDot !== "string" || !EYE_DOT_SHAPES.has(eyeDot as QrEyeDotShape)) {
    throw new QrDesignValidationError("Unsupported eye-dot shape.");
  }

  return {
    foreground: parseForeground(value.foreground),
    background: parseBackground(value.background),
    moduleShape: moduleShape as QrModuleShape,
    eyeFrame: eyeFrame as QrEyeFrameShape,
    eyeDot: eyeDot as QrEyeDotShape,
    quietZoneModules: parseQuietZone(value.quietZoneModules),
    ...(value.logo === undefined ? {} : { logo: parseQrLogoConfig(value.logo) }),
  };
}

export function isDefaultQrDesign(design: QraftQrDesign): boolean {
  return (
    design.foreground.kind === "solid" &&
    design.foreground.color === "#000000" &&
    design.background.kind === "solid" &&
    design.background.color === "#ffffff" &&
    design.moduleShape === "square" &&
    design.eyeFrame === "square" &&
    design.eyeDot === "square" &&
    design.quietZoneModules === 4 &&
    design.logo === undefined
  );
}
