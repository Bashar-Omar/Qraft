import { CodeRenderError } from "@/core/code/render";
import type { BarcodeSymbologyId } from "@/core/code/symbology";

export const CODE128_CURATED_MAX_CHARACTERS = 128;
export const CODE39_CURATED_MAX_CHARACTERS = 64;
export const CODE93_CURATED_MAX_CHARACTERS = 80;
export const ITF_CURATED_MAX_DIGITS = 80;
export const CODABAR_EXPERT_MAX_CHARACTERS = 80;
export const CODE11_EXPERT_MAX_CHARACTERS = 80;
export const MSI_EXPERT_MAX_DIGITS = 80;
export const PLESSEY_EXPERT_MAX_CHARACTERS = 64;
export const DATAMATRIX_LATIN1_MAX_BYTES = 1555;
export const PDF417_LATIN1_MAX_BYTES = 1108;
export const AZTEC_LATIN1_MAX_BYTES = 1914;
export const MICROQR_LATIN1_MAX_BYTES = 15;
export const MAXICODE_EXPERT_MAX_BYTES = 84;
export const RMQR_EXPERIMENTAL_MAX_BYTES = 100;

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
const CODABAR_BODY_PATTERN = /^[0-9\-$:\/.+]+$/;
const CODE11_PATTERN = /^[0-9-]+$/;
const PLESSEY_PATTERN = /^[0-9A-F]+$/;

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
    codabar: {
      inputMode: "text",
      rows: 3,
      placeholder: "A0123456789B",
      hint: "Expert Codabar requires A/B/C/D start and stop characters; the body accepts digits and - $ : / . + only.",
    },
    code11: {
      inputMode: "text",
      rows: 3,
      placeholder: "01234-56789",
      hint: "Expert Code 11 accepts digits and hyphen only. Qraft renders this allow-listed legacy workflow without independent decoder certification.",
    },
    msi: {
      inputMode: "numeric",
      rows: 3,
      placeholder: "0123456789",
      hint: "Expert MSI Plessey accepts digits only. Checksum variants remain outside this first generic Expert slice.",
    },
    plessey: {
      inputMode: "text",
      rows: 3,
      placeholder: "1A2B3C4D",
      hint: "Expert Plessey accepts hexadecimal 0-9/A-F only. Lowercase is rejected rather than silently normalized.",
    },
    datamatrix: {
      inputMode: "text",
      rows: 5,
      placeholder: "Qraft Data Matrix",
      hint: "ISO-8859-1 / Latin-1 bytes only. Unicode outside Latin-1 requires explicit ECI semantics.",
    },
    pdf417: {
      inputMode: "text",
      rows: 5,
      placeholder: "Qraft PDF417 document payload",
      hint: "Latin-1 byte workflow with automatic PDF417 sizing/error correction. ECI, Macro PDF417 and fixed rows/columns stay Expert-only.",
    },
    aztec: {
      inputMode: "text",
      rows: 5,
      placeholder: "Qraft Aztec ticket payload",
      hint: "Latin-1 byte workflow with automatic Aztec layers/error correction. ECI, reader-init and fixed-layer controls stay Expert-only.",
    },
    microqr: {
      inputMode: "text",
      rows: 4,
      placeholder: "MICRO-QRAFT",
      hint: "Expert Micro QR uses a conservative 15-byte Latin-1 ceiling and a two-module clear margin. Larger or ECI payloads should use regular QR.",
    },
    maxicode: {
      inputMode: "text",
      rows: 5,
      placeholder: "Qraft parcel payload",
      hint: "Expert MaxiCode uses unstructured Latin-1 data with BWIP automatic mode 4/5 selection. Structured carrier modes 2/3 and ECI stay deferred.",
    },
    rmqr: {
      inputMode: "text",
      rows: 4,
      placeholder: "Qraft narrow-label payload",
      hint: "Experimental rMQR uses a fixed R17x139 / ECC M profile with a conservative Latin-1 subset. Rendering is available, but Qraft does not yet claim independent artifact decode coverage.",
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
    throw new CodeRenderError(
      "invalid-request",
      "GTIN check-digit input must contain digits only.",
    );
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

function validateCodabar(payload: string): ValidatedBarcodePayload {
  if (payload.length > CODABAR_EXPERT_MAX_CHARACTERS) {
    throw new CodeRenderError(
      "capacity",
      `Qraft's Expert Codabar workflow is limited to ${CODABAR_EXPERT_MAX_CHARACTERS} characters.`,
    );
  }
  if (payload.length < 3 || !/[ABCD]/.test(payload[0]) || !/[ABCD]/.test(payload.at(-1) ?? "")) {
    throw new CodeRenderError(
      "invalid-request",
      "Expert Codabar requires start and stop characters A, B, C or D with at least one body character.",
    );
  }
  const body = payload.slice(1, -1);
  if (!CODABAR_BODY_PATTERN.test(body)) {
    throw new CodeRenderError(
      "invalid-request",
      "Expert Codabar body accepts digits and the symbols - $ : / . + only.",
    );
  }
  return createValidated("codabar", payload);
}

function validateCode11(payload: string): ValidatedBarcodePayload {
  if (payload.length > CODE11_EXPERT_MAX_CHARACTERS) {
    throw new CodeRenderError(
      "capacity",
      `Qraft's Expert Code 11 workflow is limited to ${CODE11_EXPERT_MAX_CHARACTERS} characters.`,
    );
  }
  if (!CODE11_PATTERN.test(payload)) {
    throw new CodeRenderError("invalid-request", "Expert Code 11 accepts digits and hyphen only.");
  }
  return createValidated("code11", payload);
}

function validateMsi(payload: string): ValidatedBarcodePayload {
  requireDigits(payload, "MSI Plessey");
  if (payload.length > MSI_EXPERT_MAX_DIGITS) {
    throw new CodeRenderError(
      "capacity",
      `Qraft's Expert MSI Plessey workflow is limited to ${MSI_EXPERT_MAX_DIGITS} digits.`,
    );
  }
  return createValidated("msi", payload);
}

function validatePlessey(payload: string): ValidatedBarcodePayload {
  if (payload.length > PLESSEY_EXPERT_MAX_CHARACTERS) {
    throw new CodeRenderError(
      "capacity",
      `Qraft's Expert Plessey workflow is limited to ${PLESSEY_EXPERT_MAX_CHARACTERS} hexadecimal characters.`,
    );
  }
  if (!PLESSEY_PATTERN.test(payload)) {
    throw new CodeRenderError(
      "invalid-request",
      "Expert Plessey accepts uppercase hexadecimal characters 0-9 and A-F only.",
    );
  }
  return createValidated("plessey", payload);
}

function validateLatin1Payload(
  symbology: Extract<
    BarcodeSymbologyId,
    "datamatrix" | "pdf417" | "aztec" | "microqr" | "maxicode" | "rmqr"
  >,
  payload: string,
  label: string,
  maxBytes: number,
  supportLabel: "Curated" | "Expert" | "Experimental" = "Curated",
): ValidatedBarcodePayload {
  let bytes = 0;
  let binaryText = "";

  for (const character of payload) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined || codePoint > 0xff) {
      throw new CodeRenderError(
        "invalid-request",
        `${supportLabel} ${label} currently accepts ISO-8859-1 / Latin-1 bytes only. Unicode outside Latin-1 requires an explicit ECI workflow before Qraft can encode it honestly.`,
      );
    }

    bytes += 1;
    if (bytes > maxBytes) {
      throw new CodeRenderError(
        "capacity",
        `${supportLabel} ${label} is limited to ${maxBytes} Latin-1 bytes in Qraft.`,
      );
    }

    binaryText += String.fromCharCode(codePoint);
  }

  return {
    symbology,
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
    codabar: validateCodabar,
    code11: validateCode11,
    msi: validateMsi,
    plessey: validatePlessey,
    datamatrix: (payload) =>
      validateLatin1Payload("datamatrix", payload, "Data Matrix", DATAMATRIX_LATIN1_MAX_BYTES),
    pdf417: (payload) =>
      validateLatin1Payload("pdf417", payload, "PDF417", PDF417_LATIN1_MAX_BYTES),
    aztec: (payload) =>
      validateLatin1Payload("aztec", payload, "Aztec Code", AZTEC_LATIN1_MAX_BYTES),
    microqr: (payload) =>
      validateLatin1Payload("microqr", payload, "Micro QR", MICROQR_LATIN1_MAX_BYTES, "Expert"),
    maxicode: (payload) =>
      validateLatin1Payload("maxicode", payload, "MaxiCode", MAXICODE_EXPERT_MAX_BYTES, "Expert"),
    rmqr: (payload) =>
      validateLatin1Payload("rmqr", payload, "rMQR", RMQR_EXPERIMENTAL_MAX_BYTES, "Experimental"),
  });

export function getBarcodeInputPolicy(symbology: BarcodeSymbologyId): BarcodeInputPolicy {
  return BARCODE_INPUT_POLICIES[symbology];
}

/**
 * Validate Qraft's allow-listed barcode boundary before any vendor encoder is called.
 */
export function validateBarcodePayload(
  symbology: BarcodeSymbologyId,
  input: unknown,
): ValidatedBarcodePayload {
  return BARCODE_PAYLOAD_VALIDATORS[symbology](requireString(input));
}
