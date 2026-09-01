import type { BarcodeSelfTestResult } from "@/core/quality/self-test";

export type BarcodeSelfTestState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "running" }>
  | Readonly<{ status: "complete"; result: BarcodeSelfTestResult }>;

type BarcodeQualityPanelProps = Readonly<{
  selfTest: BarcodeSelfTestState;
  onRunSelfTest(): void;
}>;

export function BarcodeQualityPanel({ selfTest, onRunSelfTest }: BarcodeQualityPanelProps) {
  const passed = selfTest.status === "complete" && selfTest.result.status === "passed";
  const failed = selfTest.status === "complete" && selfTest.result.status === "failed";

  return (
    <section
      className="quality-assistant quality-assistant--good"
      aria-labelledby="barcode-quality-heading"
    >
      <div className="quality-assistant__heading">
        <div>
          <span className="mono-label">QUALITY / INDEPENDENT DECODE</span>
          <strong id="barcode-quality-heading">Artifact verification</strong>
        </div>
        <span
          className={`quality-summary ${failed ? "quality-summary--risk" : "quality-summary--good"}`}
        >
          {failed ? "CHECK" : passed ? "VERIFIED" : "READY"}
        </span>
      </div>

      <div
        className={`quality-self-test ${failed ? "quality-self-test--risk" : passed ? "quality-self-test--good" : ""}`}
      >
        <div>
          <strong>
            {selfTest.status === "running"
              ? "Testing final artifact…"
              : passed
                ? "Passed independent local decode"
                : failed
                  ? "Independent decode failed"
                  : "Decode the final SVG locally"}
          </strong>
          <small>
            {failed
              ? "Treat this artifact as unverified until the content or rendering is adjusted."
              : "ZXing rasterizes and decodes Qraft's final SVG in-browser; it does not reuse BWIP's encoder."}
          </small>
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
        A software self-test is a regression signal, not print or scanner certification.
        Physical-device QA remains a release gate.
      </p>
    </section>
  );
}
