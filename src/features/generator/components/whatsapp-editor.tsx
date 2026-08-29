import type { ChangeEvent } from "react";

import type { WhatsAppPayloadInput } from "@/core/payload/codecs/whatsapp.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const EMPTY_DRAFT: WhatsAppPayloadInput = { number: "", message: "" };

function readDraft(value: unknown): WhatsAppPayloadInput {
  if (typeof value !== "object" || value === null) return EMPTY_DRAFT;
  return {
    number: "number" in value && typeof value.number === "string" ? value.number : "",
    message: "message" in value && typeof value.message === "string" ? value.message : "",
  };
}

export function WhatsAppEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = readDraft(value);
  const numberIssue = getPayloadFieldIssue(issues, "number");
  const messageIssue = getPayloadFieldIssue(issues, "message");
  const update = (patch: Partial<WhatsAppPayloadInput>) => onChange({ ...draft, ...patch });

  return (
    <div className="studio-fields-grid">
      <div className="studio-field studio-field--full">
        <label htmlFor="payload-whatsapp-number">WhatsApp number</label>
        <input
          aria-describedby="payload-whatsapp-number-hint payload-whatsapp-number-issue"
          aria-invalid={Boolean(numberIssue)}
          autoComplete="tel"
          id="payload-whatsapp-number"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ number: event.target.value })
          }
          placeholder="+1 202 555 0123"
          type="tel"
          value={draft.number}
        />
        <p className="studio-field__hint" id="payload-whatsapp-number-hint">
          Use the full international number. Qraft removes visual separators for the official wa.me
          link.
        </p>
        <p className="studio-field__issue" id="payload-whatsapp-number-issue" role="status">
          {numberIssue ?? ""}
        </p>
      </div>

      <div className="studio-field studio-field--full studio-field--compact">
        <label htmlFor="payload-whatsapp-message">Pre-filled message</label>
        <textarea
          aria-describedby="payload-whatsapp-message-hint payload-whatsapp-message-issue"
          aria-invalid={Boolean(messageIssue)}
          id="payload-whatsapp-message"
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            update({ message: event.target.value })
          }
          placeholder="Hello from Qraft 👋"
          rows={5}
          value={draft.message}
        />
        <p className="studio-field__hint" id="payload-whatsapp-message-hint">
          Optional. The text is URL-encoded locally and appears in the chat composer after opening.
        </p>
        <p className="studio-field__issue" id="payload-whatsapp-message-issue" role="status">
          {messageIssue ?? ""}
        </p>
      </div>
    </div>
  );
}
