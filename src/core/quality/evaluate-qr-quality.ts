import { qrContrastRule, calculateQrContrast } from "@/core/quality/rules/qr-contrast";
import { qrEccRule } from "@/core/quality/rules/qr-ecc";
import { qrInversionRule } from "@/core/quality/rules/qr-inversion";
import { qrQuietZoneRule } from "@/core/quality/rules/qr-quiet-zone";
import {
  summarizeQuality,
  type QrQualityAssessment,
  type QrQualityContext,
  type QualityRule,
} from "@/core/quality/quality";

export const DEFAULT_QR_QUALITY_RULES: readonly QualityRule[] = [
  qrQuietZoneRule,
  qrContrastRule,
  qrInversionRule,
  qrEccRule,
];

export function evaluateQrQuality(
  context: QrQualityContext,
  rules: readonly QualityRule[] = DEFAULT_QR_QUALITY_RULES,
): QrQualityAssessment {
  const findings = rules.flatMap((rule) => rule.evaluate(context));

  return {
    status: summarizeQuality(findings),
    findings,
    metrics: {
      contrast: calculateQrContrast(context),
      quietZoneModules: context.metadata.quietZoneModules,
      errorCorrectionLevel: context.metadata.errorCorrectionLevel,
      version: context.metadata.version,
      symbolModules: context.metadata.symbolModules,
      totalModules: context.metadata.totalModules,
      payloadBytes: context.metadata.payloadBytes,
    },
  };
}
