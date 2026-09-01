import { describe, expect, it } from "vitest";

import {
  CODE128_CURATED_MAX_CHARACTERS,
  DATAMATRIX_LATIN1_MAX_BYTES,
  computeGtinCheckDigit,
  getBarcodeInputPolicy,
  validateBarcodePayload,
} from "@/core/code/barcode-input";
import { CodeRenderError } from "@/core/code/render";

describe("barcode input validation", () => {
  it("preserves visible ASCII Code 128 content exactly", () => {
    const result = validateBarcodePayload("code128", " QRAFT-128 ");

    expect(result).toEqual({
      symbology: "code128",
      payload: " QRAFT-128 ",
      encodedPayload: " QRAFT-128 ",
      payloadBytes: 11,
      binaryText: " QRAFT-128 ",
    });
  });

  it("rejects Code 128 content outside the curated visible-ASCII contract", () => {
    expect(() => validateBarcodePayload("code128", "QRAFT\n128")).toThrowError(CodeRenderError);
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

  it("accepts the curated base character set for Code 39 and Code 93 without case coercion", () => {
    expect(validateBarcodePayload("code39", "QRAFT 39-$%/+.").encodedPayload).toBe(
      "QRAFT 39-$%/+.",
    );
    expect(validateBarcodePayload("code93", "QRAFT 93-$%/+.").encodedPayload).toBe(
      "QRAFT 93-$%/+.",
    );
    expect(() => validateBarcodePayload("code39", "lowercase")).toThrow(/uppercase/i);
    expect(() => validateBarcodePayload("code93", "QRAFT*93")).toThrow(/reserved/i);
  });

  it("rejects odd-length ITF instead of allowing the engine to silently prefix zero", () => {
    expect(validateBarcodePayload("itf", "0123456789").encodedPayload).toBe("0123456789");
    expect(() => validateBarcodePayload("itf", "12345")).toThrow(/even number of digits/i);
    expect(() => validateBarcodePayload("itf", "12A4")).toThrow(/digits only/i);
  });

  it("computes and verifies GS1 Mod-10 check digits for curated retail formats", () => {
    expect(computeGtinCheckDigit("952012345678")).toBe("8");
    expect(computeGtinCheckDigit("78858101497")).toBe("4");
    expect(computeGtinCheckDigit("0133558")).toBe("3");
    expect(computeGtinCheckDigit("0952876543210")).toBe("8");

    expect(validateBarcodePayload("ean13", "952012345678")).toMatchObject({
      payload: "952012345678",
      encodedPayload: "9520123456788",
      checkDigit: { digit: "8", status: "computed" },
    });
    expect(validateBarcodePayload("ean13", "9520123456788").checkDigit?.status).toBe("verified");
    expect(validateBarcodePayload("ean8", "0133558").encodedPayload).toBe("01335583");
    expect(validateBarcodePayload("upca", "78858101497").encodedPayload).toBe("788581014974");
    expect(validateBarcodePayload("itf14", "0952876543210").encodedPayload).toBe(
      "09528765432108",
    );
  });

  it("rejects incorrect retail check digits and unsupported lengths before BWIP", () => {
    expect(() => validateBarcodePayload("ean13", "9520123456780")).toThrow(/Expected 8/i);
    expect(() => validateBarcodePayload("ean8", "01335580")).toThrow(/Expected 3/i);
    expect(() => validateBarcodePayload("upca", "788581014970")).toThrow(/Expected 4/i);
    expect(() => validateBarcodePayload("itf14", "09528765432100")).toThrow(/Expected 8/i);
    expect(() => validateBarcodePayload("ean13", "123")).toThrow(/12 digits.*13 digits/i);
  });

  it("supports standards-defined UPC-E0 check digits without enabling non-standard UPC-E1", () => {
    expect(validateBarcodePayload("upce", "0123455")).toMatchObject({
      encodedPayload: "01234558",
      checkDigit: { digit: "8", status: "computed" },
    });
    expect(validateBarcodePayload("upce", "01234558").checkDigit?.status).toBe("verified");
    expect(validateBarcodePayload("upce", "0425261").encodedPayload).toBe("04252614");
    expect(() => validateBarcodePayload("upce", "1123455")).toThrow(/UPC-E0/i);
    expect(() => validateBarcodePayload("upce", "01234550")).toThrow(/Expected 8/i);
  });

  it("exposes Qraft-owned input policy metadata for scalable studio controls", () => {
    expect(getBarcodeInputPolicy("ean13")).toMatchObject({ inputMode: "numeric", rows: 3 });
    expect(getBarcodeInputPolicy("datamatrix")).toMatchObject({ inputMode: "text", rows: 5 });
    expect(getBarcodeInputPolicy("itf").hint).toMatch(/even digit count/i);
  });

  it("preserves Latin-1 Data Matrix bytes without implicit UTF-8 conversion", () => {
    const result = validateBarcodePayload("datamatrix", "Café\u0000");

    expect(result.payload).toBe("Café\u0000");
    expect(result.encodedPayload).toBe("Café\u0000");
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
