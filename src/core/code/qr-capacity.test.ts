import { describe, expect, it } from "vitest";

import { assessQrByteCapacity, QR_V40_BYTE_CAPACITY } from "@/core/code/qr-capacity";

describe("QR byte-mode capacity policy", () => {
  it("keeps the DENSO Version 40 binary ceilings explicit per ECC", () => {
    expect(QR_V40_BYTE_CAPACITY).toEqual({
      L: 2953,
      M: 2331,
      Q: 1663,
      H: 1273,
    });
  });

  it("classifies byte pressure without pretending it is scanner certification", () => {
    expect(assessQrByteCapacity(200, "M").pressure).toBe("low");
    expect(assessQrByteCapacity(1000, "M").pressure).toBe("moderate");
    expect(assessQrByteCapacity(1600, "M").pressure).toBe("dense");
    expect(assessQrByteCapacity(2200, "M").pressure).toBe("near-limit");
    expect(assessQrByteCapacity(2400, "M").pressure).toBe("over-limit");
  });

  it("rejects invalid metric inputs", () => {
    expect(() => assessQrByteCapacity(-1, "L")).toThrow(/non-negative/i);
    expect(() => assessQrByteCapacity(Number.NaN, "L")).toThrow(/finite/i);
  });
});
