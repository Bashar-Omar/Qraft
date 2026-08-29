import type { ChangeEvent } from "react";

import type { VCardPayloadInput } from "@/core/payload/codecs/vcard.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const EMPTY_DRAFT: VCardPayloadInput = {
  firstName: "",
  lastName: "",
  organization: "",
  title: "",
  phone: "",
  email: "",
  url: "",
};

function readDraft(value: unknown): VCardPayloadInput {
  if (typeof value !== "object" || value === null) return EMPTY_DRAFT;
  const record = value as Record<string, unknown>;
  const read = (key: keyof VCardPayloadInput) =>
    typeof record[key] === "string" ? (record[key] as string) : "";
  return {
    firstName: read("firstName"),
    lastName: read("lastName"),
    organization: read("organization"),
    title: read("title"),
    phone: read("phone"),
    email: read("email"),
    url: read("url"),
  };
}

export function VCardEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = readDraft(value);
  const update = (patch: Partial<VCardPayloadInput>) => onChange({ ...draft, ...patch });
  const issue = (field: keyof VCardPayloadInput) => getPayloadFieldIssue(issues, field);

  return (
    <div className="studio-fields-grid">
      <div className="studio-field">
        <label htmlFor="payload-vcard-first-name">First name</label>
        <input
          aria-describedby="payload-vcard-first-name-issue"
          aria-invalid={Boolean(issue("firstName"))}
          autoComplete="given-name"
          id="payload-vcard-first-name"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ firstName: event.target.value })
          }
          type="text"
          value={draft.firstName}
        />
        <p className="studio-field__issue" id="payload-vcard-first-name-issue" role="status">
          {issue("firstName") ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-vcard-last-name">Last name</label>
        <input
          aria-describedby="payload-vcard-last-name-issue"
          aria-invalid={Boolean(issue("lastName"))}
          autoComplete="family-name"
          id="payload-vcard-last-name"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ lastName: event.target.value })
          }
          type="text"
          value={draft.lastName}
        />
        <p className="studio-field__issue" id="payload-vcard-last-name-issue" role="status">
          {issue("lastName") ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-vcard-organization">Organization</label>
        <input
          aria-describedby="payload-vcard-organization-issue"
          aria-invalid={Boolean(issue("organization"))}
          autoComplete="organization"
          id="payload-vcard-organization"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ organization: event.target.value })
          }
          type="text"
          value={draft.organization}
        />
        <p className="studio-field__issue" id="payload-vcard-organization-issue" role="status">
          {issue("organization") ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-vcard-title">Job title</label>
        <input
          aria-describedby="payload-vcard-title-issue"
          aria-invalid={Boolean(issue("title"))}
          autoComplete="organization-title"
          id="payload-vcard-title"
          onChange={(event: ChangeEvent<HTMLInputElement>) => update({ title: event.target.value })}
          type="text"
          value={draft.title}
        />
        <p className="studio-field__issue" id="payload-vcard-title-issue" role="status">
          {issue("title") ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-vcard-phone">Mobile phone</label>
        <input
          aria-describedby="payload-vcard-phone-issue"
          aria-invalid={Boolean(issue("phone"))}
          autoComplete="tel"
          id="payload-vcard-phone"
          onChange={(event: ChangeEvent<HTMLInputElement>) => update({ phone: event.target.value })}
          placeholder="+1 202 555 0123"
          type="tel"
          value={draft.phone}
        />
        <p className="studio-field__issue" id="payload-vcard-phone-issue" role="status">
          {issue("phone") ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-vcard-email">Email</label>
        <input
          aria-describedby="payload-vcard-email-issue"
          aria-invalid={Boolean(issue("email"))}
          autoComplete="email"
          id="payload-vcard-email"
          onChange={(event: ChangeEvent<HTMLInputElement>) => update({ email: event.target.value })}
          type="email"
          value={draft.email}
        />
        <p className="studio-field__issue" id="payload-vcard-email-issue" role="status">
          {issue("email") ?? ""}
        </p>
      </div>

      <div className="studio-field studio-field--full">
        <label htmlFor="payload-vcard-url">Website</label>
        <input
          aria-describedby="payload-vcard-url-hint payload-vcard-url-issue"
          aria-invalid={Boolean(issue("url"))}
          autoComplete="url"
          id="payload-vcard-url"
          onChange={(event: ChangeEvent<HTMLInputElement>) => update({ url: event.target.value })}
          placeholder="https://example.com"
          spellCheck={false}
          type="url"
          value={draft.url}
        />
        <p className="studio-field__hint" id="payload-vcard-url-hint">
          Qraft emits vCard 4.0 with CRLF line endings, escaped text and UTF-8-safe line folding.
        </p>
        <p className="studio-field__issue" id="payload-vcard-url-issue" role="status">
          {issue("url") ?? ""}
        </p>
      </div>
    </div>
  );
}
