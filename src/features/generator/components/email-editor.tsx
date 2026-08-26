import type { ChangeEvent } from "react";

import type { EmailPayloadInput } from "@/core/payload/codecs/email.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const EMPTY_EMAIL_DRAFT: EmailPayloadInput = {
  recipients: "",
  subject: "",
  body: "",
};

function readDraft(value: unknown): EmailPayloadInput {
  if (typeof value !== "object" || value === null) {
    return EMPTY_EMAIL_DRAFT;
  }

  return {
    recipients:
      "recipients" in value && typeof value.recipients === "string" ? value.recipients : "",
    subject: "subject" in value && typeof value.subject === "string" ? value.subject : "",
    body: "body" in value && typeof value.body === "string" ? value.body : "",
  };
}

export function EmailEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = readDraft(value);
  const recipientsIssue = getPayloadFieldIssue(issues, "recipients");
  const subjectIssue = getPayloadFieldIssue(issues, "subject");
  const bodyIssue = getPayloadFieldIssue(issues, "body");

  const update = (patch: Partial<EmailPayloadInput>) => {
    onChange({ ...draft, ...patch });
  };

  return (
    <div className="studio-fields-grid">
      <div className="studio-field studio-field--full">
        <label htmlFor="payload-email-recipients">Recipients</label>
        <input
          aria-describedby="payload-email-recipients-hint payload-email-recipients-issue"
          aria-invalid={Boolean(recipientsIssue)}
          autoComplete="email"
          id="payload-email-recipients"
          multiple
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ recipients: event.target.value })
          }
          placeholder="hello@example.com, team@example.com"
          spellCheck={false}
          type="email"
          value={draft.recipients}
        />
        <p className="studio-field__hint" id="payload-email-recipients-hint">
          Separate up to 10 common mailbox addresses with commas.
        </p>
        <p className="studio-field__issue" id="payload-email-recipients-issue" role="status">
          {recipientsIssue ?? ""}
        </p>
      </div>

      <div className="studio-field studio-field--full">
        <label htmlFor="payload-email-subject">Subject</label>
        <input
          aria-describedby="payload-email-subject-issue"
          aria-invalid={Boolean(subjectIssue)}
          id="payload-email-subject"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ subject: event.target.value })
          }
          placeholder="Hello from Qraft"
          type="text"
          value={draft.subject}
        />
        <p className="studio-field__issue" id="payload-email-subject-issue" role="status">
          {subjectIssue ?? ""}
        </p>
      </div>

      <div className="studio-field studio-field--full studio-field--compact">
        <label htmlFor="payload-email-body">Email body</label>
        <textarea
          aria-describedby="payload-email-body-hint payload-email-body-issue"
          aria-invalid={Boolean(bodyIssue)}
          id="payload-email-body"
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            update({ body: event.target.value })
          }
          placeholder="Write the message"
          rows={5}
          value={draft.body}
        />
        <p className="studio-field__hint" id="payload-email-body-hint">
          Subject and body are UTF-8 percent-encoded locally into a mailto: URI.
        </p>
        <p className="studio-field__issue" id="payload-email-body-issue" role="status">
          {bodyIssue ?? ""}
        </p>
      </div>
    </div>
  );
}
