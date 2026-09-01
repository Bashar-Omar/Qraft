import { CodeRenderError } from "@/core/code/render";
import type { BarcodeSymbologyId } from "@/core/code/symbology";

export const CODE128_CURATED_MAX_CHARACTERS = 128;
export const DATAMATRIX_LATIN1_MAX_BYTES = 1555;

export type ValidatedBarcodePayload = Readonly<{
  symbology: BarcodeSymbologyId;
  payload: string;
  payloadBytes: number;
  /**
   * Eight-bit string handed to BWIP with `binarytext: true`.
   * Core owns the text/byte semantics; the adapter must not silently UTF-8 transcode it.
   */
  binaryText: string;
}>;

type BarcodePayloadValidator = (payload: string) => ValidatedBarcodePayload;

function requireString(payload: unknown): string {
  if (typeof payload !== "string") {
    throw new CodeRenderError("invalid-request", "Barcode content must be text.");
  }

  if (payload.length === 0) {
    throw new CodeRenderError("invalid-request", "Barcode content cannot be empty.");
  }

  return payload;
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

  return {
    symbology: "code128",
    payload,
    payloadBytes: payload.length,
    binaryText: payload,
  };
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
    payloadBytes: bytes,
    binaryText,
  };
}

/**
 * Qraft-owned validation registry for the curated Phase 4B barcode slice.
 * New symbologies add a validator entry rather than growing a central switch.
 */
const BARCODE_PAYLOAD_VALIDATORS: Readonly<Record<BarcodeSymbologyId, BarcodePayloadValidator>> =
  Object.freeze({
    code128: validateCode128,
    datamatrix: validateDataMatrix,
  });

/**
 * Validate Qraft's deliberately curated Phase 4B barcode input boundary.
 *
 * This is not the complete capacity/character-set model for either standard.
 * It is the stable product subset Qraft can describe and test before Expert/GS1/ECI work lands.
 */
export function validateBarcodePayload(
  symbology: BarcodeSymbologyId,
  input: unknown,
): ValidatedBarcodePayload {
  return BARCODE_PAYLOAD_VALIDATORS[symbology](requireString(input));
}
