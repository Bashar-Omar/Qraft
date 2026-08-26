import type { QrQualityAssessment, QualitySeverity } from "@/core/quality/quality";
import type { QrSelfTestResult } from "@/core/quality/self-test";

export type QualitySelfTestState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "running" }>
  | Readonly<{ status: "complete"; result: QrSelfTestResult }>;

const SEVERITY_LABEL: Record<QualitySeverity, string> = {
  blocker: "BLOCKER",
  "high-risk": "HIGH RISK",
  "medium-risk": "MEDIUM RISK",
  advisory: "ADVISORY",
};

function summaryLabel(status: QrQualityAssessment["status"]): string {
  if (status === "risk") {
    return "RISK";
  }

  if (status === "check") {
    return "CHECK";
  }

  return "GOOD";
}

function selfTestCopy(state: QualitySelfTestState): Readonly<{
  title: string;
  detail: string;
  tone: "neutral" | "good" | "risk";
}> {
  if (state.status === "running") {
    return {
      title: "Running local self-test…",
      detail: "Qraft is rasterizing this exact artifact and decoding it locally.",
      tone: "neutral",
    };
  }

  if (state.status === "complete") {
    if (state.result.status === "passed") {
      return {
        title: "Passed local self-test",
        detail: "The rasterized artifact decoded locally and the raw payload matched exactly.",
        tone: "good",
      };
    }

    return {
      title: "Local self-test failed",
      detail:
        state.result.reason === "payload-mismatch"
          ? "A QR was decoded, but its raw value did not exactly match the generated payload."
          : "The local decoder could not read this representative rasterized artifact.",
      tone: "risk",
    };
  }

  return {
    title: "Self-test not run",
    detail: "Run an independent local decode on the exact current SVG before important use.",
    tone: "neutral",
  };
}

type QualityAssistantProps = Readonly<{
  assessment: QrQualityAssessment;
  selfTest: QualitySelfTestState;
  onRunSelfTest(): void;
}>;

export function QualityAssistant({ assessment, selfTest, onRunSelfTest }: QualityAssistantProps) {
  const selfTestStatus = selfTestCopy(selfTest);
  const summaryStatus =
    selfTest.status === "complete" && selfTest.result.status === "failed"
      ? "risk"
      : assessment.status;
  const contrast = assessment.metrics.contrast;
  const contrastLabel =
    contrast.rating === "unknown"
      ? "PLACEMENT DEPENDENT"
      : `${contrast.rating.toUpperCase()} · ${contrast.minimumRatio?.toFixed(2)}:1`;

  return (
    <section
      className={`quality-assistant quality-assistant--${summaryStatus}`}
      aria-labelledby="quality-heading"
    >
      <div className="quality-assistant__heading">
        <div>
          <span className="mono-label">QUALITY / HEURISTIC</span>
          <strong id="quality-heading">Quality Assistant</strong>
        </div>
        <span className={`quality-summary quality-summary--${summaryStatus}`}>
          {summaryLabel(summaryStatus)}
        </span>
      </div>

      <div className="quality-metrics" aria-label="QR quality metrics">
        <span>CONTRAST</span>
        <strong>{contrastLabel}</strong>
        <span>QUIET ZONE</span>
        <strong>{assessment.metrics.quietZoneModules} MODULES</strong>
        <span>DENSITY</span>
        <strong>
          V{assessment.metrics.version} · {assessment.metrics.symbolModules}×
          {assessment.metrics.symbolModules}
        </strong>
        <span>ECC</span>
        <strong>{assessment.metrics.errorCorrectionLevel}</strong>
      </div>

      {assessment.findings.length > 0 ? (
        <div className="quality-findings">
          {assessment.findings.map((finding) => (
            <article
              className={`quality-finding quality-finding--${finding.severity}`}
              key={finding.id}
            >
              <div className="quality-finding__topline">
                <span>{SEVERITY_LABEL[finding.severity]}</span>
                <strong>{finding.title}</strong>
              </div>
              <p>{finding.detail}</p>
              <small>{finding.fix}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="quality-assistant__clear">
          No deterministic risk finding is active for this design. That is guidance, not
          certification.
        </p>
      )}

      <div
        aria-busy={selfTest.status === "running"}
        aria-live="polite"
        className={`quality-self-test quality-self-test--${selfTestStatus.tone}`}
      >
        <div>
          <span className="mono-label">LOCAL SELF-TEST</span>
          <strong>{selfTestStatus.title}</strong>
          <small>{selfTestStatus.detail}</small>
        </div>
        <button
          className="button button--secondary"
          disabled={selfTest.status === "running"}
          onClick={onRunSelfTest}
          type="button"
        >
          {selfTest.status === "running" ? "Testing…" : "Run self-test"}
        </button>
      </div>

      <p className="quality-assistant__disclaimer">
        Qraft uses explainable heuristics and a synthetic local decode. It does not certify scan
        reliability.
      </p>
    </section>
  );
}
