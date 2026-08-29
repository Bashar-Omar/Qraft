import type { ChangeEvent } from "react";

import type { AppLinkPayloadInput, AppLinkStrategy } from "@/core/payload/codecs/app-link.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const EMPTY_DRAFT: AppLinkPayloadInput = {
  strategy: "https",
  destination: "",
};

function readDraft(value: unknown): AppLinkPayloadInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return EMPTY_DRAFT;

  const record = value as Record<string, unknown>;
  const strategy: AppLinkStrategy = record.strategy === "custom-scheme" ? "custom-scheme" : "https";

  return {
    strategy,
    destination: typeof record.destination === "string" ? record.destination : "",
  };
}

export function AppLinkEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = readDraft(value);
  const update = (patch: Partial<AppLinkPayloadInput>) => onChange({ ...draft, ...patch });
  const destinationIssue = getPayloadFieldIssue(issues, "destination");
  const strategyIssue = getPayloadFieldIssue(issues, "strategy");
  const isHttps = draft.strategy === "https";

  return (
    <div className="studio-fields-grid">
      <div className="studio-field">
        <label htmlFor="payload-app-strategy">Link strategy</label>
        <select
          aria-describedby="payload-app-strategy-hint payload-app-strategy-issue"
          aria-invalid={Boolean(strategyIssue)}
          id="payload-app-strategy"
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            update({ strategy: event.target.value as AppLinkStrategy })
          }
          value={draft.strategy}
        >
          <option value="https">HTTPS app / universal link · recommended</option>
          <option value="custom-scheme">Custom app URI scheme · advanced</option>
        </select>
        <p className="studio-field__hint" id="payload-app-strategy-hint">
          {isHttps
            ? "Use an HTTPS URL that the destination owner has associated with its iOS/Android app. Qraft validates the URL locally but cannot verify that platform association."
            : "Use only a URI scheme owned and handled by the target app. Custom schemes can collide with other apps and do not provide an automatic web fallback."}
        </p>
        <p className="studio-field__issue" id="payload-app-strategy-issue" role="status">
          {strategyIssue ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-app-destination">App link destination</label>
        <input
          aria-describedby="payload-app-destination-hint payload-app-destination-issue"
          aria-invalid={Boolean(destinationIssue)}
          autoComplete="url"
          id="payload-app-destination"
          inputMode="url"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ destination: event.target.value })
          }
          placeholder={isHttps ? "https://example.com/app/product/42" : "myapp://product/42?ref=qr"}
          spellCheck={false}
          type="text"
          value={draft.destination}
        />
        <p className="studio-field__hint" id="payload-app-destination-hint">
          {isHttps
            ? "Qraft encodes this one HTTPS destination exactly. Browser/app fallback is controlled by the destination website and installed app."
            : "Qraft does not add redirect infrastructure or a second fallback URL. Use Raw only when you deliberately need a protocol outside this curated helper."}
        </p>
        <p className="studio-field__issue" id="payload-app-destination-issue" role="status">
          {destinationIssue ?? ""}
        </p>
      </div>
    </div>
  );
}
