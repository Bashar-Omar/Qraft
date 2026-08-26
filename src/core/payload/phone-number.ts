import { PayloadValidationError } from "@/core/payload/payload";

const MAX_GLOBAL_DIGITS = 15;
const VISUAL_SEPARATORS = /[\s().-]/g;

export function normalizeGlobalPhoneNumber(value: string, field = "number"): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new PayloadValidationError("Enter a phone number.", [
      { field, message: "A phone number is required." },
    ]);
  }

  if (!trimmed.startsWith("+")) {
    throw new PayloadValidationError("Use an international phone number.", [
      {
        field,
        message: "Start with + and the country calling code, for example +12025550123.",
      },
    ]);
  }

  const normalized = trimmed.replace(VISUAL_SEPARATORS, "");

  if (!/^\+\d+$/.test(normalized)) {
    throw new PayloadValidationError("Use a valid international phone number.", [
      {
        field,
        message:
          "Use only digits after +. Spaces, parentheses, dots and hyphens are allowed for readability.",
      },
    ]);
  }

  const digitCount = normalized.length - 1;

  if (digitCount < 3 || digitCount > MAX_GLOBAL_DIGITS) {
    throw new PayloadValidationError("Use a valid international phone number.", [
      {
        field,
        message: `Use between 3 and ${MAX_GLOBAL_DIGITS} digits after +.`,
      },
    ]);
  }

  return normalized;
}
