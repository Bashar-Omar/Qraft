const SAFE_FILENAME_PATTERN = /[^a-z0-9._-]+/gi;

export function sanitizeFilenameBase(value: string): string {
  const normalized = value.trim().replace(SAFE_FILENAME_PATTERN, "-").replace(/-+/g, "-");
  const stripped = normalized.replace(/^[-.]+|[-.]+$/g, "");

  return stripped.slice(0, 80) || "qraft-code";
}
