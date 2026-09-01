import type { QrRenderMetadata } from "@/core/code/render";
import type { QraftQrDesign } from "@/core/design/qr-design";
import type { QrLogoGeometryEstimate } from "@/core/design/qr-logo";

export type QualitySeverity = "blocker" | "high-risk" | "medium-risk" | "advisory";
export type QualitySummaryStatus = "good" | "check" | "risk";
export type QrContrastRating = "strong" | "moderate" | "low" | "unknown";

export type QualityFinding = Readonly<{
  id: string;
  severity: QualitySeverity;
  title: string;
  detail: string;
  fix: string;
}>;

export type QrContrastMetric = Readonly<{
  rating: QrContrastRating;
  minimumRatio: number | null;
  sampleCount: number;
}>;

export type QrQualityMetrics = Readonly<{
  contrast: QrContrastMetric;
  quietZoneModules: number;
  errorCorrectionLevel: QrRenderMetadata["errorCorrectionLevel"];
  version: number;
  symbolModules: number;
  totalModules: number;
  payloadBytes: number;
  logo: QrLogoGeometryEstimate | null;
}>;

export type QrQualityContext = Readonly<{
  design: QraftQrDesign;
  metadata: QrRenderMetadata;
}>;

export interface QualityRule {
  readonly id: string;
  evaluate(context: QrQualityContext): readonly QualityFinding[];
}

export type QrQualityAssessment = Readonly<{
  status: QualitySummaryStatus;
  findings: readonly QualityFinding[];
  metrics: QrQualityMetrics;
}>;

const RISK_SEVERITIES = new Set<QualitySeverity>(["blocker", "high-risk"]);

export function summarizeQuality(findings: readonly QualityFinding[]): QualitySummaryStatus {
  if (findings.some((finding) => RISK_SEVERITIES.has(finding.severity))) {
    return "risk";
  }

  if (findings.length > 0) {
    return "check";
  }

  return "good";
}
