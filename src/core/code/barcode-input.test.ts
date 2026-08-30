import { describe, expect, it } from "vitest";

import {
  CODE128_CURATED_MAX_CHARACTERS,
  DATAMATRIX_LATIN1_MAX_BYTES,
  validateBarcodePayload,
} from "@/core/code/barcode-input";
import { CodeRenderError } from "@/core/code/render";

describe("barcode input validation", () => {
  it("preserves visible ASCII Code 128 content exactly", () => {
    const result = validateBarcodePayload("code128", " QRAFT-128 ");

    expect(result).toEqual({
      symbology: "code128",
      payload: " QRAFT-128 ",
      payloadBytes: 11,
      binaryText: " QRAFT-128 ",
    });
  });

  it("rejects Code 128 content outside the curated visible-ASCII contract", () => {
    expect(() => validateBarcodePayload("code128", "QRAFT\n128")).toThrowError(
      CodeRenderError,
    );
    expect(() => validateBarcodePayload("code128", "Café")).toThrow(/visible ASCII/i);
  });

  it("enforces the Qraft operational Code 128 length boundary", () => {
    expect(() =>
      validateBarcodePayload("code128", "A".repeat(CODE128_CURATED_MAX_CHARACTERS)),
    ).not.toThrow();
    expect(() =>
      validateBarcodePayload("code128", "A".repeat(CODE128_CURATED_MAX_CHARACTERS + 1)),
    ).toThrow(/limited to 128 characters/i);
  });

  it("preserves Latin-1 Data Matrix bytes without implicit UTF-8 conversion", () => {
    const result = validateBarcodePayload("datamatrix", "Café\u0000");

    expect(result.payload).toBe("Café\u0000");
    expect(result.payloadBytes).toBe(5);
    expect(Array.from(result.binaryText, (character) => character.charCodeAt(0))).toEqual([
      67, 97, 102, 233, 0,
    ]);
  });

  it("rejects Data Matrix Unicode that needs ECI instead of guessing scanner semantics", () => {
    expect(() => validateBarcodePayload("datamatrix", "Qraft €")).toThrow(/ECI/i);
    expect(() => validateBarcodePayload("datamatrix", "مرحبا")).toThrow(/Latin-1/i);
  });

  it("enforces the curated Data Matrix byte ceiling", () => {
    expect(() =>
      validateBarcodePayload("datamatrix", "A".repeat(DATAMATRIX_LATIN1_MAX_BYTES)),
    ).not.toThrow();
    expect(() =>
      validateBarcodePayload("datamatrix", "A".repeat(DATAMATRIX_LATIN1_MAX_BYTES + 1)),
    ).toThrow(/1555 Latin-1 bytes/i);
  });

  it("rejects empty and non-string content before an engine is called", () => {
    expect(() => validateBarcodePayload("code128", "")).toThrow(/cannot be empty/i);
    expect(() => validateBarcodePayload("datamatrix", 123)).toThrow(/must be text/i);
  });
});
