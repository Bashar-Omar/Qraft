import { describe, expect, it } from "vitest";

import { QR_DESIGN_PRESETS, getQrDesignPreset } from "@/core/design/presets";
import { parseQrDesign } from "@/core/design/qr-design";

describe("QR design presets", () => {
  it("keeps preset definitions inside the Qraft-owned design schema", () => {
    expect(QR_DESIGN_PRESETS.map((preset) => preset.id)).toEqual([
      "pure-mono",
      "qraft-mint",
      "soft-mint",
      "packaging",
    ]);

    for (const preset of QR_DESIGN_PRESETS) {
      expect(parseQrDesign(preset.design)).toEqual(preset.design);
    }
  });

  it("resolves a preset by stable id", () => {
    expect(getQrDesignPreset("qraft-mint").label).toBe("Qraft Mint");
  });
});
