import type { ChangeEvent } from "react";

import {
  SOCIAL_PLATFORM_IDS,
  type SocialLinkPayloadInput,
  type SocialPlatformId,
} from "@/core/payload/codecs/social-link.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const PLATFORM_OPTIONS: readonly Readonly<{
  id: SocialPlatformId;
  label: string;
  placeholder: string;
}>[] = [
  { id: "x", label: "X", placeholder: "@username or https://x.com/username" },
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "@username or https://www.instagram.com/username/",
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "@username or https://www.tiktok.com/@username",
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "@handle or https://www.youtube.com/@handle",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "profile-slug or https://www.linkedin.com/in/profile-slug",
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "username or https://www.facebook.com/username",
  },
];

const SOCIAL_PLATFORM_ID_SET = new Set<SocialPlatformId>(SOCIAL_PLATFORM_IDS);

const EMPTY_DRAFT: SocialLinkPayloadInput = {
  platform: "x",
  target: "",
};

function readDraft(value: unknown): SocialLinkPayloadInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return EMPTY_DRAFT;

  const record = value as Record<string, unknown>;
  const platform =
    typeof record.platform === "string" &&
    SOCIAL_PLATFORM_ID_SET.has(record.platform as SocialPlatformId)
      ? (record.platform as SocialPlatformId)
      : "x";

  return {
    platform,
    target: typeof record.target === "string" ? record.target : "",
  };
}

function platformHint(platform: SocialPlatformId): string {
  switch (platform) {
    case "x":
      return "Enter the @handle or paste its full X profile URL. X handle syntax is validated locally; Qraft does not check account existence.";
    case "instagram":
      return "Enter the username or paste an Instagram HTTPS profile URL. A leading @ is optional for shorthand.";
    case "tiktok":
      return "Enter the creator username or paste a TikTok HTTPS profile URL. Shorthand becomes tiktok.com/@username.";
    case "youtube":
      return "Enter a channel handle or paste a YouTube channel URL. Unicode handles are percent-encoded safely when Qraft builds the URL.";
    case "linkedin":
      return "Shorthand builds a linkedin.com/in/ public-profile URL. Paste the full LinkedIn URL for company pages or other LinkedIn page forms.";
    case "facebook":
      return "Enter a Facebook username or paste the full HTTPS profile/page URL. Qraft only validates the destination locally.";
  }
}

export function SocialLinkEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = readDraft(value);
  const update = (patch: Partial<SocialLinkPayloadInput>) => onChange({ ...draft, ...patch });
  const platformIssue = getPayloadFieldIssue(issues, "platform");
  const targetIssue = getPayloadFieldIssue(issues, "target");
  const selected =
    PLATFORM_OPTIONS.find((definition) => definition.id === draft.platform) ?? PLATFORM_OPTIONS[0];

  return (
    <div className="studio-fields-grid">
      <div className="studio-field">
        <label htmlFor="payload-social-platform">Platform</label>
        <select
          aria-describedby="payload-social-platform-hint payload-social-platform-issue"
          aria-invalid={Boolean(platformIssue)}
          id="payload-social-platform"
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            update({ platform: event.target.value as SocialPlatformId })
          }
          value={draft.platform}
        >
          {PLATFORM_OPTIONS.map((definition) => (
            <option key={definition.id} value={definition.id}>
              {definition.label}
            </option>
          ))}
        </select>
        <p className="studio-field__hint" id="payload-social-platform-hint">
          Qraft builds or validates one direct HTTPS destination. It does not create a hosted bio
          page, redirect or analytics layer.
        </p>
        <p className="studio-field__issue" id="payload-social-platform-issue" role="status">
          {platformIssue ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-social-target">Handle or profile/page URL</label>
        <input
          aria-describedby="payload-social-target-hint payload-social-target-issue"
          aria-invalid={Boolean(targetIssue)}
          autoComplete="url"
          id="payload-social-target"
          inputMode="url"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ target: event.target.value })
          }
          placeholder={selected.placeholder}
          spellCheck={false}
          type="text"
          value={draft.target}
        />
        <p className="studio-field__hint" id="payload-social-target-hint">
          {platformHint(draft.platform)}
        </p>
        <p className="studio-field__issue" id="payload-social-target-issue" role="status">
          {targetIssue ?? ""}
        </p>
      </div>
    </div>
  );
}
