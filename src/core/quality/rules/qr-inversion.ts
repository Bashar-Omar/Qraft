import { relativeLuminance, sampleForegroundColors } from "@/core/quality/color";
import type { QrQualityContext, QualityFinding, QualityRule } from "@/core/quality/quality";

function evaluateInversion(context: QrQualityContext): readonly QualityFinding[] {
  if (context.design.background.kind === "transparent") {
    return [];
  }

  const backgroundLuminance = relativeLuminance(context.design.background.color);
  const moduleLuminances = sampleForegroundColors(context.design.foreground).map(relativeLuminance);
  const lighterSamples = moduleLuminances.filter((value) => value > backgroundLuminance).length;

  if (lighterSamples === moduleLuminances.length) {
    return [
      {
        id: "qr-inverted-polarity",
        severity: "medium-risk",
        title: "Light modules on a darker background",
        detail:
          "Some scanners are less tolerant of inverted QR polarity than the conventional dark-on-light pattern.",
        fix: "Prefer darker modules on a lighter background for the widest compatibility.",
      },
    ];
  }

  if (lighterSamples > 0) {
    return [
      {
        id: "qr-mixed-polarity-gradient",
        severity: "high-risk",
        title: "Gradient crosses the background brightness",
        detail:
          "Parts of the module gradient are lighter than the background while other parts are darker, which can weaken binarization.",
        fix: "Keep the whole module gradient consistently darker than the background.",
      },
    ];
  }

  return [];
}

export const qrInversionRule: QualityRule = {
  id: "qr-inversion",
  evaluate: evaluateInversion,
};
