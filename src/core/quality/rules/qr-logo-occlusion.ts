import { QR_ECC_APPROX_RECOVERY_FRACTION } from "@/core/code/render";
import { estimateQrLogoGeometry } from "@/core/design/qr-logo";
import type { QrQualityContext, QualityFinding, QualityRule } from "@/core/quality/quality";

function evaluateLogoOcclusion(context: QrQualityContext): readonly QualityFinding[] {
  const logo = context.design.logo;

  if (!logo) {
    return [];
  }

  const geometry = estimateQrLogoGeometry(logo, context.metadata.symbolModules);
  const coverageFraction = geometry.estimatedCenterCoveragePercent / 100;
  const recoveryFraction = QR_ECC_APPROX_RECOVERY_FRACTION[context.metadata.errorCorrectionLevel];
  const recoveryBudgetRatio = coverageFraction / recoveryFraction;
  const coverage = geometry.estimatedCenterCoveragePercent.toFixed(1);

  if (recoveryBudgetRatio >= 0.5) {
    return [
      {
        id: "qr-logo-occlusion-high",
        severity: "high-risk",
        title: "Logo uses substantial restoration headroom",
        detail: `The centered logo clearance area covers about ${coverage}% of the symbol area, which is a large share of the approximate ${context.metadata.errorCorrectionLevel}-level recovery budget.`,
        fix: "Reduce the logo area or move to Q/H ECC, then run the local self-test on the final artifact.",
      },
    ];
  }

  if (recoveryBudgetRatio >= 0.35 || context.metadata.errorCorrectionLevel === "L") {
    return [
      {
        id: "qr-logo-occlusion-medium",
        severity: "medium-risk",
        title: "Logo leaves limited ECC headroom",
        detail: `The centered logo clearance area is about ${coverage}% of the symbol area. More restoration headroom is preferable before important use.`,
        fix: "Prefer Q or H ECC, keep the logo conservative, and run the local self-test.",
      },
    ];
  }

  if (context.metadata.errorCorrectionLevel === "M") {
    return [
      {
        id: "qr-logo-ecc-advisory",
        severity: "advisory",
        title: "Branded QR benefits from stronger ECC",
        detail: `The logo clearance area is about ${coverage}% of the symbol area. Level M can work, but Q/H provides more restoration headroom for a branded center.`,
        fix: "Use the conservative logo action for Q-level ECC, then verify the final artifact with the local self-test.",
      },
    ];
  }

  return [];
}

export const qrLogoOcclusionRule: QualityRule = {
  id: "qr-logo-occlusion",
  evaluate: evaluateLogoOcclusion,
};
