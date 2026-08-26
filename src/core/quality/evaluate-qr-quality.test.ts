import { describe, expect, it } from "vitest";

import type { RenderMetadata } from "@/core/code/render";
import { DEFAULT_QR_DESIGN, parseQrDesign } from "@/core/design/qr-design";
import { evaluateQrQuality } from "@/core/quality/evaluate-qr-quality";

const metadata: RenderMetadata = {
  rendererId: "standard-qr",
  symbology: "qr",
  errorCorrectionLevel: "M",
  quietZoneModules: 4,
  symbolModules: 21,
  totalModules: 29,
  version: 1,
  payloadBytes: 12,
};

describe("evaluateQrQuality", () => {
  it("keeps the conservative black-on-white baseline clear", () => {
    const assessment = evaluateQrQuality({ design: DEFAULT_QR_DESIGN, metadata });

    expect(assessment.status).toBe("good");
    expect(assessment.findings).toEqual([]);
    expect(assessment.metrics.contrast.rating).toBe("strong");
    expect(assessment.metrics.contrast.minimumRatio).toBe(21);
  });

  it("flags low contrast without presenting a compliance claim", () => {
    const design = parseQrDesign({
      ...DEFAULT_QR_DESIGN,
      foreground: { kind: "solid", color: "#0fbf8f" },
    });
    const assessment = evaluateQrQuality({ design, metadata });

    expect(assessment.status).toBe("risk");
    expect(assessment.metrics.contrast.rating).toBe("low");
    expect(assessment.findings.map((finding) => finding.id)).toContain("qr-low-contrast");
  });

  it("marks transparent output as placement-dependent", () => {
    const design = parseQrDesign({
      ...DEFAULT_QR_DESIGN,
      background: { kind: "transparent" },
    });
    const assessment = evaluateQrQuality({ design, metadata });

    expect(assessment.status).toBe("check");
    expect(assessment.metrics.contrast.rating).toBe("unknown");
    expect(assessment.findings.map((finding) => finding.id)).toContain("qr-transparent-placement");
  });

  it("warns for inverted light-on-dark polarity", () => {
    const design = parseQrDesign({
      ...DEFAULT_QR_DESIGN,
      foreground: { kind: "solid", color: "#ffffff" },
      background: { kind: "solid", color: "#111111" },
    });
    const assessment = evaluateQrQuality({ design, metadata });

    expect(assessment.status).toBe("check");
    expect(assessment.findings.map((finding) => finding.id)).toContain("qr-inverted-polarity");
  });

  it("keeps the quiet-zone rule independent from design parsing", () => {
    const assessment = evaluateQrQuality({
      design: DEFAULT_QR_DESIGN,
      metadata: { ...metadata, quietZoneModules: 3, totalModules: 27 },
    });

    expect(assessment.status).toBe("risk");
    expect(assessment.findings.map((finding) => finding.id)).toContain("qr-quiet-zone");
  });

  it("suggests more ECC headroom when level L is paired with stronger styling", () => {
    const design = parseQrDesign({
      ...DEFAULT_QR_DESIGN,
      foreground: {
        kind: "linear-gradient",
        from: "#04120d",
        to: "#0b6b55",
        rotationDegrees: 45,
      },
      moduleShape: "dots",
    });
    const assessment = evaluateQrQuality({
      design,
      metadata: { ...metadata, errorCorrectionLevel: "L" },
    });

    expect(assessment.status).toBe("check");
    expect(assessment.findings.map((finding) => finding.id)).toContain("qr-ecc-styling");
  });
});
