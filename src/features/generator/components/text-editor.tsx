import type { ChangeEvent } from "react";

import type { PayloadEditorProps } from "@/features/generator/components/payload-editor.types";

export function TextEditor({ value, issue, onChange }: PayloadEditorProps) {
  return (
    <div className="studio-field">
      <label htmlFor="payload-text">Text</label>
      <textarea
        aria-describedby="payload-text-hint payload-text-issue"
        aria-invalid={Boolean(issue)}
        id="payload-text"
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        placeholder="Type the text to encode"
        rows={8}
        value={value}
      />
      <p className="studio-field__hint" id="payload-text-hint">
        Plain text is encoded locally and preserved exactly, including line breaks.
      </p>
      <p className="studio-field__issue" id="payload-text-issue" role="status">
        {issue ?? ""}
      </p>
    </div>
  );
}
