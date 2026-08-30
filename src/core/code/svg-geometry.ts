export type VectorDimensions = Readonly<{
  width: number;
  height: number;
}>;

const SVG_VIEWBOX_PATTERN =
  /\bviewBox\s*=\s*["']\s*0(?:\.0+)?\s+0(?:\.0+)?\s+([0-9]+(?:\.[0-9]+)?)\s+([0-9]+(?:\.[0-9]+)?)\s*["']/i;

/** Reads Qraft's canonical zero-origin SVG geometry without touching the DOM. */
export function parseSvgViewBoxDimensions(svg: string): VectorDimensions {
  const match = SVG_VIEWBOX_PATTERN.exec(svg);
  if (!match) {
    throw new Error("Generated SVG must contain a zero-origin viewBox with positive dimensions.");
  }

  const width = Number(match[1]);
  const height = Number(match[2]);

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new Error("Generated SVG viewBox dimensions must be positive finite numbers.");
  }

  return { width, height };
}
