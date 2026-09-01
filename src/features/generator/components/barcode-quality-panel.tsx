import type { SymbologyVerification } from "@/core/code/symbology";
import type { BarcodeSelfTestResult } from "@/core/quality/self-test";

export type BarcodeSelfTestState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "running" }>
  | Readonly<{ status: "complete"; result: BarcodeSelfTestResult }>;

type BarcodeQualityPanelProps = Readonly<{
  verification: SymbologyVerification;
  selfTest: BarcodeSelfTestState;
  onRunSelfTest(): void;
}>;

export function BarcodeQualityPanel({
  verification,
  selfTest,
  onRunSelfTest,
}: BarcodeQualityPanelProps) {
  const rendererOnly = verification.artifactSelfTest === "renderer-only";
  const passed =
    !rendererOnly && selfTest.status === "complete" && selfTest.result.status === "passed";
  const failed =
    !rendererOnly && selfTest.status === "complete" && selfTest.result.status === "failed";

  return (
    <section
      className={`quality-assistant ${failed ? "quality-assistant--risk" : "quality-assistant--good"}`}
      aria-labelledby="barcode-quality-heading"
    >
      <div className="quality-assistant__heading">
        <div>
          <span className="mono-label">
            {rendererOnly ? "QUALITY / RENDERER BOUNDARY" : "QUALITY / INDEPENDENT DECODE"}
          </span>
          <strong id="barcode-quality-heading">Artifact verification</strong>
        </div>
        <span
          className={`quality-summary ${failed ? "quality-summary--risk" : "quality-summary--good"}`}
        >
          {rendererOnly ? "RENDER ONLY" : failed ? "CHECK" : passed ? "VERIFIED" : "READY"}
        </span>
      </div>

      <div
        className={`quality-self-test ${failed ? "quality-self-test--risk" : passed ? "quality-self-test--good" : ""}`}
      >
        <div>
          <strong>
            {rendererOnly
              ? "Independent decoder unavailable"
              : selfTest.status === "running"
                ? "Testing final artifact…"
                : passed
                  ? "Passed independent local decode"
                  : failed
                    ? "Independent decode failed"
                    : "Decode the final SVG locally"}
          </strong>
          <small>
            {rendererOnly
              ? verification.note
              : failed
                ? "Treat this artifact as unverified until the content or rendering is adjusted."
                : "ZXing rasterizes and decodes Qraft's final SVG in-browser; it does not reuse BWIP's encoder."}
          </small>
        </div>
        {rendererOnly ? null : (
          <button
            className="button button--secondary"
            disabled={selfTest.status === "running"}
            onClick={onRunSelfTest}
            type="button"
          >
            {selfTest.status === "running" ? "Testing…" : "Run self-test"}
          </button>
        )}
      </div>

      <p className="quality-assistant__disclaimer">
        {rendererOnly
          ? "Renderer-backed support is explicit and narrower than independent scanner verification. Use a target-device test before production."
          : "A software self-test is a regression signal, not print or scanner certification. Physical-device QA remains a release gate."}
      </p>
    </section>
  );
}
