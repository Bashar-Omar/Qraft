import type { ChangeEvent } from "react";

import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

export function UrlEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = typeof value === "string" ? value : "";
  const issue = getPayloadFieldIssue(issues, "url");

  return (
    <div className="studio-field">
      <label htmlFor="payload-url">Destination</label>
      <input
        aria-describedby="payload-url-hint payload-url-issue"
        aria-invalid={Boolean(issue)}
        autoComplete="url"
        id="payload-url"
        inputMode="url"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder="example.com"
        spellCheck={false}
        type="text"
        value={draft}
      />
      <p className="studio-field__hint" id="payload-url-hint">
        Missing schemes are normalized to https://. Qraft never fetches the destination to generate
        a code.
      </p>
      <p className="studio-field__issue" id="payload-url-issue" role="status">
        {issue ?? ""}
      </p>
    </div>
  );
}
