import type { ChangeEvent } from "react";

import type { SmsPayloadInput } from "@/core/payload/codecs/sms.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const EMPTY_SMS_DRAFT: SmsPayloadInput = {
  number: "",
  body: "",
};

function readDraft(value: unknown): SmsPayloadInput {
  if (typeof value !== "object" || value === null) {
    return EMPTY_SMS_DRAFT;
  }

  return {
    number: "number" in value && typeof value.number === "string" ? value.number : "",
    body: "body" in value && typeof value.body === "string" ? value.body : "",
  };
}

export function SmsEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = readDraft(value);
  const numberIssue = getPayloadFieldIssue(issues, "number");
  const bodyIssue = getPayloadFieldIssue(issues, "body");

  const update = (patch: Partial<SmsPayloadInput>) => {
    onChange({ ...draft, ...patch });
  };

  return (
    <div className="studio-fields-grid">
      <div className="studio-field studio-field--full">
        <label htmlFor="payload-sms-number">Recipient number</label>
        <input
          aria-describedby="payload-sms-number-hint payload-sms-number-issue"
          aria-invalid={Boolean(numberIssue)}
          autoComplete="tel"
          id="payload-sms-number"
          inputMode="tel"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ number: event.target.value })
          }
          placeholder="+1 202 555 0123"
          spellCheck={false}
          type="tel"
          value={draft.number}
        />
        <p className="studio-field__hint" id="payload-sms-number-hint">
          Use international +country-code format for predictable mobile handling.
        </p>
        <p className="studio-field__issue" id="payload-sms-number-issue" role="status">
          {numberIssue ?? ""}
        </p>
      </div>

      <div className="studio-field studio-field--full studio-field--compact">
        <label htmlFor="payload-sms-body">SMS message</label>
        <textarea
          aria-describedby="payload-sms-body-hint payload-sms-body-issue"
          aria-invalid={Boolean(bodyIssue)}
          id="payload-sms-body"
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            update({ body: event.target.value })
          }
          placeholder="Optional message"
          rows={5}
          value={draft.body}
        />
        <p className="studio-field__hint" id="payload-sms-body-hint">
          The message is encoded into the standards-based sms: URI body field.
        </p>
        <p className="studio-field__issue" id="payload-sms-body-issue" role="status">
          {bodyIssue ?? ""}
        </p>
      </div>
    </div>
  );
}
