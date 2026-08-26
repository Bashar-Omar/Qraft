import type { QrHexColor, QrForegroundPaint } from "@/core/design/qr-design";

export type RgbColor = Readonly<{ r: number; g: number; b: number }>;

const GRADIENT_SAMPLE_STOPS = [0, 0.25, 0.5, 0.75, 1] as const;

export function hexToRgb(color: QrHexColor): RgbColor {
  return {
    r: Number.parseInt(color.slice(1, 3), 16),
    g: Number.parseInt(color.slice(3, 5), 16),
    b: Number.parseInt(color.slice(5, 7), 16),
  };
}

function srgbChannelToLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color: QrHexColor): number {
  const { r, g, b } = hexToRgb(color);
  const red = srgbChannelToLinear(r);
  const green = srgbChannelToLinear(g);
  const blue = srgbChannelToLinear(b);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(first: QrHexColor, second: QrHexColor): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function toHexChannel(value: number): string {
  return Math.round(Math.max(0, Math.min(255, value)))
    .toString(16)
    .padStart(2, "0");
}

function interpolateColor(from: QrHexColor, to: QrHexColor, amount: number): QrHexColor {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const mix = (left: number, right: number) => left + (right - left) * amount;

  return `#${toHexChannel(mix(start.r, end.r))}${toHexChannel(mix(start.g, end.g))}${toHexChannel(mix(start.b, end.b))}` as QrHexColor;
}

export function sampleForegroundColors(paint: QrForegroundPaint): readonly QrHexColor[] {
  if (paint.kind === "solid") {
    return [paint.color];
  }

  return GRADIENT_SAMPLE_STOPS.map((stop) => interpolateColor(paint.from, paint.to, stop));
}
