import { describe, expect, it } from "vitest";

import {
  DEFAULT_QR_DESIGN,
  QrDesignValidationError,
  isDefaultQrDesign,
  parseQrDesign,
} from "@/core/design/qr-design";

describe("QR design model", () => {
  it("normalizes safe Qraft-owned design values", () => {
    expect(
      parseQrDesign({
        foreground: {
          kind: "linear-gradient",
          from: "#1B1F24",
          to: "#0B6B55",
          rotationDegrees: 405,
        },
        background: { kind: "solid", color: "#FFFFFF" },
        moduleShape: "rounded",
        eyeFrame: "extra-rounded",
        eyeDot: "dot",
        quietZoneModules: 4,
      }),
    ).toEqual({
      foreground: {
        kind: "linear-gradient",
        from: "#1b1f24",
        to: "#0b6b55",
        rotationDegrees: 45,
      },
      background: { kind: "solid", color: "#ffffff" },
      moduleShape: "rounded",
      eyeFrame: "extra-rounded",
      eyeDot: "dot",
      quietZoneModules: 4,
    });
  });

  it("accepts an explicit transparent background", () => {
    const design = parseQrDesign({
      ...DEFAULT_QR_DESIGN,
      background: { kind: "transparent" },
    });

    expect(design.background).toEqual({ kind: "transparent" });
  });

  it("rejects colors and quiet zones outside the supported design contract", () => {
    expect(() =>
      parseQrDesign({
        ...DEFAULT_QR_DESIGN,
        foreground: { kind: "solid", color: "red" },
      }),
    ).toThrow(QrDesignValidationError);

    expect(() =>
      parseQrDesign({
        ...DEFAULT_QR_DESIGN,
        quietZoneModules: 2,
      }),
    ).toThrow(QrDesignValidationError);
  });

  it("recognizes the conservative default independently of object identity", () => {
    expect(isDefaultQrDesign(parseQrDesign(DEFAULT_QR_DESIGN))).toBe(true);
    expect(
      isDefaultQrDesign(
        parseQrDesign({
          ...DEFAULT_QR_DESIGN,
          moduleShape: "rounded",
        }),
      ),
    ).toBe(false);
  });
});
