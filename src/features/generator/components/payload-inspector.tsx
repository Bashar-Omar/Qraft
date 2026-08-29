"use client";

import { useState } from "react";

import type { PayloadInspectorResult } from "@/application/inspect/inspect-payload";

type PayloadInspectorProps = Readonly<{
  result: PayloadInspectorResult;
}>;

export function PayloadInspector({ result }: PayloadInspectorProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");

  const copyRawPayload = async () => {
    setCopyStatus("idle");

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(result.rawPayload);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <section className="payload-inspector" aria-label="Payload inspector">
      <div className="payload-inspector__heading">
        <div>
          <span className="mono-label">PAYLOAD INSPECTOR</span>
          <strong>{result.label}</strong>
        </div>
        <span className="local-pill">LOCAL</span>
      </div>

      <div className="payload-inspector__metrics" aria-label="Payload metrics">
        <span>
          <small>UTF-8</small>
          <strong>{result.metrics.utf8Bytes.toLocaleString()} B</strong>
        </span>
        <span>
          <small>CODE POINTS</small>
          <strong>{result.metrics.codePoints.toLocaleString()}</strong>
        </span>
        <span>
          <small>LINES</small>
          <strong>{(result.metrics.lineBreaks + 1).toLocaleString()}</strong>
        </span>
        <span>
          <small>CONTROLS</small>
          <strong>{result.metrics.nonWhitespaceControlCharacters.toLocaleString()}</strong>
        </span>
      </div>

      {result.fields.length ? (
        <dl className="payload-inspector__fields">
          {result.fields.map((field) => (
            <div key={field.key}>
              <dt>{field.label}</dt>
              <dd>{field.value || "—"}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <details className="payload-inspector__raw">
        <summary>Raw encoded payload</summary>
        <pre>{result.rawPayload}</pre>
      </details>

      <div className="payload-inspector__footer">
        <button
          className="button button--secondary"
          onClick={() => void copyRawPayload()}
          type="button"
        >
          Copy raw payload
        </button>
        <p role="status">
          {copyStatus === "copied"
            ? "Copied locally."
            : copyStatus === "error"
              ? "Clipboard access was unavailable."
              : "Inspected locally. Nothing is opened automatically."}
        </p>
      </div>
    </section>
  );
}
