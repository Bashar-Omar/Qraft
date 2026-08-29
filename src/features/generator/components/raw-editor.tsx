import type { ChangeEvent } from "react";

import { assessQrByteCapacity } from "@/core/code/qr-capacity";
import { measureRawPayload } from "@/core/payload/codecs/raw.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const PRESSURE_LABELS = {
  low: "LOW",
  moderate: "MODERATE",
  dense: "DENSE",
  "near-limit": "NEAR LIMIT",
  "over-limit": "OVER LIMIT",
} as const;

export function RawEditor({ value, issues, onChange, renderContext }: PayloadEditorProps) {
  const draft =
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof value.value === "string"
      ? value.value
      : "";
  const issue = getPayloadFieldIssue(issues, "value");
  const metrics = measureRawPayload(draft);
  const capacity = assessQrByteCapacity(metrics.utf8Bytes, renderContext.qrErrorCorrectionLevel);

  return (
    <div className="studio-field">
      <label htmlFor="payload-raw">Raw payload</label>
      <textarea
        aria-describedby="payload-raw-hint payload-raw-metrics payload-raw-issue"
        aria-invalid={Boolean(issue)}
        autoCapitalize="off"
        autoCorrect="off"
        id="payload-raw"
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange({ value: event.target.value })
        }
        placeholder="Paste the exact payload bytes you want represented as UTF-8"
        rows={10}
        spellCheck={false}
        value={draft}
      />
      <p className="studio-field__hint" id="payload-raw-hint">
        Exact mode: Qraft does not trim, rewrite, URL-normalize or interpret this content before QR
        encoding.
      </p>

      <div className="raw-payload-metrics" id="payload-raw-metrics">
        <span>
          <small>UTF-8</small>
          <strong>{metrics.utf8Bytes.toLocaleString()} bytes</strong>
        </span>
        <span>
          <small>Code points</small>
          <strong>{metrics.codePoints.toLocaleString()}</strong>
        </span>
        <span>
          <small>ECC {renderContext.qrErrorCorrectionLevel} ceiling</small>
          <strong>{capacity.capacity.toLocaleString()} bytes</strong>
        </span>
        <span data-pressure={capacity.pressure}>
          <small>Byte pressure</small>
          <strong>{PRESSURE_LABELS[capacity.pressure]}</strong>
        </span>
      </div>
      <p className="studio-field__hint">
        Ceiling = Version 40 byte mode for the selected ECC. The live preview shows the actual
        version/modules once the payload renders.
      </p>

      {metrics.nonWhitespaceControlCharacters > 0 ? (
        <p className="raw-payload-warning">
          Contains {metrics.nonWhitespaceControlCharacters.toLocaleString()} non-whitespace control
          character
          {metrics.nonWhitespaceControlCharacters === 1 ? "" : "s"}. Qraft preserves them, but
          scanner/display behavior can vary.
        </p>
      ) : null}

      <p className="studio-field__issue" id="payload-raw-issue" role="status">
        {issue ?? ""}
      </p>
    </div>
  );
}
