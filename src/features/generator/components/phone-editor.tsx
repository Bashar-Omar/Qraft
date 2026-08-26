import type { ChangeEvent } from "react";

import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

export function PhoneEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = typeof value === "string" ? value : "";
  const issue = getPayloadFieldIssue(issues, "number");

  return (
    <div className="studio-field">
      <label htmlFor="payload-phone">Phone number</label>
      <input
        aria-describedby="payload-phone-hint payload-phone-issue"
        aria-invalid={Boolean(issue)}
        autoComplete="tel"
        id="payload-phone"
        inputMode="tel"
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder="+1 202 555 0123"
        spellCheck={false}
        type="tel"
        value={draft}
      />
      <p className="studio-field__hint" id="payload-phone-hint">
        Use international +country-code format. Visual separators are removed before encoding.
      </p>
      <p className="studio-field__issue" id="payload-phone-issue" role="status">
        {issue ?? ""}
      </p>
    </div>
  );
}
