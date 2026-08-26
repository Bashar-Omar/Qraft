import { contrastRatio, sampleForegroundColors } from "@/core/quality/color";
import type {
  QrContrastMetric,
  QrQualityContext,
  QualityFinding,
  QualityRule,
} from "@/core/quality/quality";

const STRONG_CONTRAST = 7;
const MODERATE_CONTRAST = 4.5;

export function calculateQrContrast(context: QrQualityContext): QrContrastMetric {
  if (context.design.background.kind === "transparent") {
    return {
      rating: "unknown",
      minimumRatio: null,
      sampleCount: 0,
    };
  }

  const backgroundColor = context.design.background.color;
  const samples = sampleForegroundColors(context.design.foreground);
  const ratios = samples.map((color) => contrastRatio(color, backgroundColor));
  const minimumRatio = Math.min(...ratios);

  return {
    rating:
      minimumRatio >= STRONG_CONTRAST
        ? "strong"
        : minimumRatio >= MODERATE_CONTRAST
          ? "moderate"
          : "low",
    minimumRatio,
    sampleCount: samples.length,
  };
}

function evaluateContrast(context: QrQualityContext): readonly QualityFinding[] {
  const metric = calculateQrContrast(context);

  if (metric.rating === "unknown") {
    return [
      {
        id: "qr-transparent-placement",
        severity: "advisory",
        title: "Transparent placement needs a surface check",
        detail:
          "Qraft cannot know the final background behind a transparent QR, so contrast depends on where the file is placed.",
        fix: "Place the QR over a plain high-contrast surface and run the local self-test again.",
      },
    ];
  }

  if (metric.rating === "low") {
    return [
      {
        id: "qr-low-contrast",
        severity: "high-risk",
        title: "Low visual contrast",
        detail: `The weakest sampled module/background contrast is ${metric.minimumRatio?.toFixed(2)}:1. This is a Qraft luminance heuristic, not a QR compliance threshold.`,
        fix: "Use darker modules, a lighter background, or a more conservative gradient.",
      },
    ];
  }

  if (metric.rating === "moderate") {
    return [
      {
        id: "qr-moderate-contrast",
        severity: "medium-risk",
        title: "Moderate visual contrast",
        detail: `The weakest sampled contrast is ${metric.minimumRatio?.toFixed(2)}:1. It may be less forgiving after scaling, printing, or compression.`,
        fix: "Increase the light/dark separation if the code will be printed small or used in difficult lighting.",
      },
    ];
  }

  return [];
}

export const qrContrastRule: QualityRule = {
  id: "qr-contrast",
  evaluate: evaluateContrast,
};
