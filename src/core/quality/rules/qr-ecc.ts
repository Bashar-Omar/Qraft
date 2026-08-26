import type { QrQualityContext, QualityFinding, QualityRule } from "@/core/quality/quality";

function hasAggressiveStyling(context: QrQualityContext): boolean {
  return (
    context.design.foreground.kind === "linear-gradient" ||
    context.design.moduleShape === "dots" ||
    context.design.moduleShape === "classy" ||
    context.design.moduleShape === "classy-rounded" ||
    context.design.moduleShape === "extra-rounded"
  );
}

function evaluateEcc(context: QrQualityContext): readonly QualityFinding[] {
  if (context.metadata.errorCorrectionLevel !== "L" || !hasAggressiveStyling(context)) {
    return [];
  }

  return [
    {
      id: "qr-ecc-styling",
      severity: "medium-risk",
      title: "Low ECC with stronger visual styling",
      detail:
        "Level L provides the least restoration headroom. Styling can remove visual redundancy even when the payload still renders correctly.",
      fix: "Prefer M or Q for a styled code, then run the local self-test on the final design.",
    },
  ];
}

export const qrEccRule: QualityRule = {
  id: "qr-ecc-styling",
  evaluate: evaluateEcc,
};
