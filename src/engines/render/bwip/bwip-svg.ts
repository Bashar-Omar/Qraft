import { parseSvgViewBoxDimensions } from "@/core/code/svg-geometry";
import { CodeRenderError } from "@/core/code/render";

const MAX_BWIP_SVG_CHARACTERS = 4 * 1024 * 1024;
const ALLOWED_TAGS = new Set(["svg", "path", "rect", "defs", "clippath"]);
const FORBIDDEN_ATTRIBUTE_PATTERN = /\s(?:on[a-z0-9_-]+|href|xlink:href|style)\s*=/i;
const URL_REFERENCE_PATTERN = /url\(([^)]*)\)/gi;
const TAG_PATTERN = /<\/?\s*([a-z][a-z0-9:-]*)\b/gi;

export type SafeBwipSvg = Readonly<{
  svg: string;
  width: number;
  height: number;
}>;

/**
 * BWIP's SVG drawing backend emits paths/rects plus local clip paths only.
 * Qraft still treats vendor output as an untrusted boundary and validates the
 * narrow structure before it becomes the canonical artifact.
 */
export function validateBwipSvg(svg: unknown): SafeBwipSvg {
  if (typeof svg !== "string" || svg.length === 0) {
    throw new CodeRenderError("engine", "The barcode engine did not return SVG output.");
  }

  if (svg.length > MAX_BWIP_SVG_CHARACTERS) {
    throw new CodeRenderError("engine", "The barcode engine returned an unexpectedly large SVG.");
  }

  const trimmed = svg.trim();
  if (!trimmed.startsWith("<svg ") || !trimmed.endsWith("</svg>")) {
    throw new CodeRenderError("engine", "The barcode engine returned malformed SVG output.");
  }

  if (/<!DOCTYPE|<\?xml|<!--|<!\[CDATA\[/i.test(trimmed)) {
    throw new CodeRenderError("engine", "The barcode engine returned unsupported SVG markup.");
  }

  if (FORBIDDEN_ATTRIBUTE_PATTERN.test(trimmed)) {
    throw new CodeRenderError("engine", "The barcode engine returned unsafe SVG attributes.");
  }

  for (const match of trimmed.matchAll(TAG_PATTERN)) {
    const tag = match[1]?.toLowerCase();
    if (!tag || !ALLOWED_TAGS.has(tag)) {
      throw new CodeRenderError("engine", `The barcode engine returned an unsupported SVG <${tag}> tag.`);
    }
  }

  for (const match of trimmed.matchAll(URL_REFERENCE_PATTERN)) {
    const value = match[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
    if (!/^#[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value)) {
      throw new CodeRenderError("engine", "The barcode engine returned an external SVG reference.");
    }
  }

  let dimensions: ReturnType<typeof parseSvgViewBoxDimensions>;
  try {
    dimensions = parseSvgViewBoxDimensions(trimmed);
  } catch {
    throw new CodeRenderError("engine", "The barcode engine returned invalid SVG geometry.");
  }

  return {
    svg: trimmed,
    width: dimensions.width,
    height: dimensions.height,
  };
}
