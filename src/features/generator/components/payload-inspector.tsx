"use client";

import { useState } from "react";

import type {
  PayloadInspectionBasis,
  PayloadInspectorResult,
} from "@/application/inspect/inspect-payload";

type PayloadInspectorProps = Readonly<{
  result: PayloadInspectorResult;
}>;

const BASIS_LABELS: Readonly<Record<PayloadInspectionBasis, string>> = {
  preferred: "KNOWN INTENT",
  signature: "SIGNATURE",
  fallback: "TEXT FALLBACK",
};

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
        <div className="payload-inspector__badges" aria-label="Inspection status">
          <span className="inspection-basis-pill">{BASIS_LABELS[result.basis]}</span>
          <span className="local-pill">LOCAL</span>
        </div>
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

      {result.destination ? (
        <div className="payload-inspector__destination" aria-label="Destination metadata">
          <span>
            <small>SCHEME</small>
            <strong>{result.destination.scheme.toUpperCase()}</strong>
          </span>
          <span>
            <small>HOST</small>
            <strong>{result.destination.host ?? "NON-WEB"}</strong>
          </span>
          <span>
            <small>OPEN POLICY</small>
            <strong>{result.destination.href ? "EXPLICIT ONLY" : "COPY ONLY"}</strong>
          </span>
        </div>
      ) : null}

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

      {result.notices.length ? (
        <ul className="payload-inspector__notices" aria-label="Inspection notices">
          {result.notices.map((notice) => (
            <li className={`is-${notice.severity}`} key={`${notice.severity}-${notice.message}`}>
              <strong>{notice.severity === "risk" ? "CHECK" : "INFO"}</strong>
              <span>{notice.message}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <details className="payload-inspector__raw">
        <summary>Raw encoded payload</summary>
        <pre>{result.rawPayload}</pre>
      </details>

      <div className="payload-inspector__footer">
        <div className="payload-inspector__actions">
          <button
            className="button button--secondary"
            onClick={() => void copyRawPayload()}
            type="button"
          >
            Copy raw payload
          </button>
          {result.destination?.href ? (
            <a
              className="button button--secondary"
              href={result.destination.href}
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              target="_blank"
            >
              Open destination
            </a>
          ) : null}
        </div>
        <p role="status">
          {copyStatus === "copied"
            ? "Copied locally."
            : copyStatus === "error"
              ? "Clipboard access was unavailable."
              : "Nothing opens automatically. Valid syntax does not prove destination safety."}
        </p>
      </div>
    </section>
  );
}
