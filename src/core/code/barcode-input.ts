import { CodeRenderError } from "@/core/code/render";
import type { BarcodeSymbologyId } from "@/core/code/symbology";

export const CODE128_CURATED_MAX_CHARACTERS = 128;
export const CODE39_CURATED_MAX_CHARACTERS = 64;
export const CODE93_CURATED_MAX_CHARACTERS = 80;
export const ITF_CURATED_MAX_DIGITS = 80;
export const DATAMATRIX_LATIN1_MAX_BYTES = 1555;

export type BarcodeCheckDigit = Readonly<{
  digit: string;
  status: "computed" | "verified";
}>;

export type ValidatedBarcodePayload = Readonly<{
  symbology: BarcodeSymbologyId;
  /** Exact user-facing value accepted by the Qraft validator. */
  payload: string;
  /** Exact value handed to the encoder and expected back from an independent decoder. */
  encodedPayload: string;
  payloadBytes: number;
  /**
   * Eight-bit string handed to BWIP with `binarytext: true`.
   * Core owns the text/byte semantics; the adapter must not silently UTF-8 transcode it.
   */
  binaryText: string;
  checkDigit?: BarcodeCheckDigit;
}>;

export type BarcodeInputPolicy = Readonly<{
  inputMode: "text" | "numeric";
  rows: number;
  placeholder: string;
  hint: string;
}>;

type BarcodePayloadValidator = (payload: string) => ValidatedBarcodePayload;

const BASIC_CODE39_PATTERN = /^[0-9A-Z .\-$\/+%]+$/;
const DIGITS_PATTERN = /^\d+$/;

export const BARCODE_INPUT_POLICIES: Readonly<Record<BarcodeSymbologyId, BarcodeInputPolicy>> =
  Object.freeze({
    code128: {
      inputMode: "text",
      rows: 3,
      placeholder: "QRAFT-128-001",
      hint: "Visible ASCII only. Control, FNC, GS1 and extended-byte workflows stay Expert-only.",
    },
    code39: {
      inputMode: "text",
      rows: 3,
      placeholder: "QRAFT-39",
      hint: "Uppercase A-Z, digits, space and - . $ / + % only. Extended ASCII stays Expert-only.",
    },
    code93: {
      inputMode: "text",
      rows: 3,
      placeholder: "QRAFT-93",
      hint: "Standard Code 93 character set only: uppercase A-Z, digits, space and - . $ / + %.",
    },
    itf: {
      inputMode: "numeric",
      rows: 3,
      placeholder: "0123456789",
      hint: "Digits only, with an even digit count. Qraft rejects the engine's implicit leading-zero padding.",
    },
    itf14: {
      inputMode: "numeric",
      rows: 3,
      placeholder: "0952876543210",
      hint: "Enter 13 GTIN digits and Qraft computes the check digit, or enter all 14 for verification.",
    },
    ean13: {
      inputMode: "numeric",
      rows: 3,
      placeholder: "952012345678",
      hint: "Enter 12 GTIN digits and Qraft computes the check digit, or enter all 13 for verification.",
    },
    ean8: {
      inputMode: "numeric",
      rows: 3,
      placeholder: "0133558",
      hint: "Enter 7 GTIN digits and Qraft computes the check digit, or enter all 8 for verification.",
    },
    upca: {
      inputMode: "numeric",
      rows: 3,
      placeholder: "78858101497",
      hint: "Enter 11 UPC-A digits and Qraft computes the check digit, or enter all 12 for verification.",
    },
    upce: {
      inputMode: "numeric",
      rows: 3,
      placeholder: "0123455",
      hint: "Curated UPC-E accepts standard UPC-E0 only: 7 digits without, or 8 digits with, its verified check digit.",
    },
    datamatrix: {
      inputMode: "text",
      rows: 5,
      placeholder: "Qraft Data Matrix",
      hint: "ISO-8859-1 / Latin-1 bytes only. Unicode outside Latin-1 requires explicit ECI semantics.",
    },
  });

function requireString(payload: unknown): string {
  if (typeof payload !== "string") {
    throw new CodeRenderError("invalid-request", "Barcode content must be text.");
  }

  if (payload.length === 0) {
    throw new CodeRenderError("invalid-request", "Barcode content cannot be empty.");
  }

  return payload;
}

function createValidated(
  symbology: BarcodeSymbologyId,
  payload: string,
  encodedPayload = payload,
  checkDigit?: BarcodeCheckDigit,
): ValidatedBarcodePayload {
  return {
    symbology,
    payload,
    encodedPayload,
    payloadBytes: encodedPayload.length,
    binaryText: encodedPayload,
    ...(checkDigit ? { checkDigit } : {}),
  };
}

function requireDigits(payload: string, label: string): void {
  if (!DIGITS_PATTERN.test(payload)) {
    throw new CodeRenderError("invalid-request", `${label} accepts digits only.`);
  }
}

/** GS1 Mod-10 check digit used by GTIN-8/12/13/14. */
export function computeGtinCheckDigit(dataDigits: string): string {
  if (!DIGITS_PATTERN.test(dataDigits)) {
    throw new CodeRenderError("invalid-request", "GTIN check-digit input must contain digits only.");
  }

  let sum = 0;
  let weight = 3;
  for (let index = dataDigits.length - 1; index >= 0; index -= 1) {
    sum += Number(dataDigits[index]) * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return String((10 - (sum % 10)) % 10);
}

function validateGtin(
  symbology: Extract<BarcodeSymbologyId, "ean13" | "ean8" | "upca" | "itf14">,
  payload: string,
  label: string,
  dataLength: number,
): ValidatedBarcodePayload {
  requireDigits(payload, label);
  const fullLength = dataLength + 1;
  if (payload.length !== dataLength && payload.length !== fullLength) {
    throw new CodeRenderError(
      "invalid-request",
      `${label} requires ${dataLength} digits without a check digit or ${fullLength} digits with one.`,
    );
  }

  const dataDigits = payload.slice(0, dataLength);
  const digit = computeGtinCheckDigit(dataDigits);
  if (payload.length === fullLength && payload[fullLength - 1] !== digit) {
    throw new CodeRenderError(
      "invalid-request",
      `${label} check digit is invalid. Expected ${digit}.`,
    );
  }

  const encodedPayload = `${dataDigits}${digit}`;
  return createValidated(symbology, payload, encodedPayload, {
    digit,
    status: payload.length === dataLength ? "computed" : "verified",
  });
}

function expandUpceDataToUpcaData(payload: string): string {
  const numberSystem = payload[0];
  const digits = payload.slice(1, 7);
  const [d1, d2, d3, d4, d5, d6] = digits;

  if (d6 === "0" || d6 === "1" || d6 === "2") {
    return `${numberSystem}${d1}${d2}${d6}0000${d3}${d4}${d5}`;
  }
  if (d6 === "3") {
    return `${numberSystem}${d1}${d2}${d3}00000${d4}${d5}`;
  }
  if (d6 === "4") {
    return `${numberSystem}${d1}${d2}${d3}${d4}00000${d5}`;
  }
  return `${numberSystem}${d1}${d2}${d3}${d4}${d5}0000${d6}`;
}

function validateUpce(payload: string): ValidatedBarcodePayload {
  requireDigits(payload, "UPC-E");
  if (payload.length !== 7 && payload.length !== 8) {
    throw new CodeRenderError(
      "invalid-request",
      "UPC-E requires 7 digits without a check digit or 8 digits with one.",
    );
  }
  if (!payload.startsWith("0")) {
    throw new CodeRenderError(
      "invalid-request",
      "Curated UPC-E supports standards-defined UPC-E0 only; the number system must start with 0.",
    );
  }

  const compressedData = payload.slice(0, 7);
  const digit = computeGtinCheckDigit(expandUpceDataToUpcaData(compressedData));
  if (payload.length === 8 && payload[7] !== digit) {
    throw new CodeRenderError(
      "invalid-request",
      `UPC-E check digit is invalid. Expected ${digit}.`,
    );
  }

  return createValidated("upce", payload, `${compressedData}${digit}`, {
    digit,
    status: payload.length === 7 ? "computed" : "verified",
  });
}

function validateCode128(payload: string): ValidatedBarcodePayload {
  if (payload.length > CODE128_CURATED_MAX_CHARACTERS) {
    throw new CodeRenderError(
      "capacity",
      `Qraft's curated Code 128 workflow is limited to ${CODE128_CURATED_MAX_CHARACTERS} characters.`,
    );
  }

  for (let index = 0; index < payload.length; index += 1) {
    const codePoint = payload.charCodeAt(index);
    if (codePoint < 0x20 || codePoint > 0x7e) {
      throw new CodeRenderError(
        "invalid-request",
        "Curated Code 128 currently accepts visible ASCII only. Control, FNC, GS1 and extended-byte workflows are reserved for Expert Mode.",
      );
    }
  }

  return createValidated("code128", payload);
}

function validateBasicCode(
  symbology: "code39" | "code93",
  payload: string,
  maxCharacters: number,
): ValidatedBarcodePayload {
  const label = symbology === "code39" ? "Code 39" : "Code 93";
  if (payload.length > maxCharacters) {
    throw new CodeRenderError(
      "capacity",
      `Qraft's curated ${label} workflow is limited to ${maxCharacters} characters.`,
    );
  }
  if (!BASIC_CODE39_PATTERN.test(payload) || payload.includes("*")) {
    throw new CodeRenderError(
      "invalid-request",
      `Curated ${label} accepts uppercase A-Z, digits, space and - . $ / + % only. Extended and reserved shift/start-stop characters stay Expert-only.`,
    );
  }
  return createValidated(symbology, payload);
}

function validateItf(payload: string): ValidatedBarcodePayload {
  requireDigits(payload, "Interleaved 2 of 5");
  if (payload.length > ITF_CURATED_MAX_DIGITS) {
    throw new CodeRenderError(
      "capacity",
      `Qraft's curated Interleaved 2 of 5 workflow is limited to ${ITF_CURATED_MAX_DIGITS} digits.`,
    );
  }
  if (payload.length % 2 !== 0) {
    throw new CodeRenderError(
      "invalid-request",
      "Interleaved 2 of 5 requires an even number of digits in Qraft. Odd input is rejected instead of silently prefixing a zero.",
    );
  }
  return createValidated("itf", payload);
}

function validateDataMatrix(payload: string): ValidatedBarcodePayload {
  let bytes = 0;
  let binaryText = "";

  for (const character of payload) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined || codePoint > 0xff) {
      throw new CodeRenderError(
        "invalid-request",
        "Curated Data Matrix currently accepts ISO-8859-1 / Latin-1 bytes only. Unicode outside Latin-1 requires an explicit ECI workflow before Qraft can encode it honestly.",
      );
    }

    bytes += 1;
    if (bytes > DATAMATRIX_LATIN1_MAX_BYTES) {
      throw new CodeRenderError(
        "capacity",
        `Curated Data Matrix is limited to ${DATAMATRIX_LATIN1_MAX_BYTES} Latin-1 bytes.`,
      );
    }

    binaryText += String.fromCharCode(codePoint);
  }

  return {
    symbology: "datamatrix",
    payload,
    encodedPayload: payload,
    payloadBytes: bytes,
    binaryText,
  };
}

const BARCODE_PAYLOAD_VALIDATORS: Readonly<Record<BarcodeSymbologyId, BarcodePayloadValidator>> =
  Object.freeze({
    code128: validateCode128,
    code39: (payload) => validateBasicCode("code39", payload, CODE39_CURATED_MAX_CHARACTERS),
    code93: (payload) => validateBasicCode("code93", payload, CODE93_CURATED_MAX_CHARACTERS),
    itf: validateItf,
    itf14: (payload) => validateGtin("itf14", payload, "ITF-14", 13),
    ean13: (payload) => validateGtin("ean13", payload, "EAN-13", 12),
    ean8: (payload) => validateGtin("ean8", payload, "EAN-8", 7),
    upca: (payload) => validateGtin("upca", payload, "UPC-A", 11),
    upce: validateUpce,
    datamatrix: validateDataMatrix,
  });

export function getBarcodeInputPolicy(symbology: BarcodeSymbologyId): BarcodeInputPolicy {
  return BARCODE_INPUT_POLICIES[symbology];
}

/**
 * Validate Qraft's curated barcode boundary before any vendor encoder is called.
 */
export function validateBarcodePayload(
  symbology: BarcodeSymbologyId,
  input: unknown,
): ValidatedBarcodePayload {
  return BARCODE_PAYLOAD_VALIDATORS[symbology](requireString(input));
}
