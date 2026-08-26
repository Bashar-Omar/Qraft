import type { QrQualityContext, QualityFinding, QualityRule } from "@/core/quality/quality";

function evaluateQuietZone(context: QrQualityContext): readonly QualityFinding[] {
  if (context.metadata.quietZoneModules >= 4) {
    return [];
  }

  return [
    {
      id: "qr-quiet-zone",
      severity: "blocker",
      title: "Quiet zone is below the regular QR baseline",
      detail: `The rendered code reports ${context.metadata.quietZoneModules} quiet-zone modules; regular QR requires four modules on each side.`,
      fix: "Restore a quiet zone of at least four modules before export.",
    },
  ];
}

export const qrQuietZoneRule: QualityRule = {
  id: "qr-quiet-zone",
  evaluate: evaluateQuietZone,
};
