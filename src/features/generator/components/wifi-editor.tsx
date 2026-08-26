import type { ChangeEvent } from "react";

import type { WifiPayloadInput, WifiSecurity } from "@/core/payload/codecs/wifi.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const EMPTY_WIFI_DRAFT: WifiPayloadInput = {
  ssid: "",
  security: "WPA",
  password: "",
  hidden: false,
};

function readDraft(value: unknown): WifiPayloadInput {
  if (typeof value !== "object" || value === null) {
    return EMPTY_WIFI_DRAFT;
  }

  const security: WifiSecurity =
    "security" in value &&
    (value.security === "WPA" || value.security === "WEP" || value.security === "nopass")
      ? value.security
      : "WPA";

  return {
    ssid: "ssid" in value && typeof value.ssid === "string" ? value.ssid : "",
    security,
    password: "password" in value && typeof value.password === "string" ? value.password : "",
    hidden: "hidden" in value && typeof value.hidden === "boolean" ? value.hidden : false,
  };
}

export function WifiEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = readDraft(value);
  const ssidIssue = getPayloadFieldIssue(issues, "ssid");
  const passwordIssue = getPayloadFieldIssue(issues, "password");

  const update = (patch: Partial<WifiPayloadInput>) => {
    onChange({ ...draft, ...patch });
  };

  const updateSecurity = (security: WifiSecurity) => {
    update({ security, ...(security === "nopass" ? { password: "" } : {}) });
  };

  return (
    <div className="studio-fields-grid">
      <div className="studio-field studio-field--full">
        <label htmlFor="payload-wifi-ssid">Network name (SSID)</label>
        <input
          aria-describedby="payload-wifi-ssid-hint payload-wifi-ssid-issue"
          aria-invalid={Boolean(ssidIssue)}
          autoComplete="off"
          id="payload-wifi-ssid"
          onChange={(event: ChangeEvent<HTMLInputElement>) => update({ ssid: event.target.value })}
          placeholder="Qraft Lab"
          spellCheck={false}
          type="text"
          value={draft.ssid}
        />
        <p className="studio-field__hint" id="payload-wifi-ssid-hint">
          SSIDs are limited to 32 UTF-8 bytes and escaped without leaving the browser.
        </p>
        <p className="studio-field__issue" id="payload-wifi-ssid-issue" role="status">
          {ssidIssue ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-wifi-security">Security</label>
        <select
          id="payload-wifi-security"
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            updateSecurity(event.target.value as WifiSecurity)
          }
          value={draft.security}
        >
          <option value="WPA">WPA / WPA2</option>
          <option value="WEP">WEP — legacy</option>
          <option value="nopass">Open / no password</option>
        </select>
      </div>

      {draft.security !== "nopass" ? (
        <div className="studio-field">
          <label htmlFor="payload-wifi-password">Password</label>
          <input
            aria-describedby="payload-wifi-password-hint payload-wifi-password-issue"
            aria-invalid={Boolean(passwordIssue)}
            autoComplete="off"
            id="payload-wifi-password"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              update({ password: event.target.value })
            }
            placeholder="Network password"
            spellCheck={false}
            type="password"
            value={draft.password}
          />
          <p className="studio-field__hint" id="payload-wifi-password-hint">
            Stored only in the current in-memory studio state.
          </p>
          <p className="studio-field__issue" id="payload-wifi-password-issue" role="status">
            {passwordIssue ?? ""}
          </p>
        </div>
      ) : null}

      <label className="studio-checkbox studio-field--full" htmlFor="payload-wifi-hidden">
        <input
          checked={draft.hidden}
          id="payload-wifi-hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ hidden: event.target.checked })
          }
          type="checkbox"
        />
        <span>
          <strong>Hidden network</strong>
          <small>Include the hidden-network flag in the Wi-Fi payload.</small>
        </span>
      </label>
    </div>
  );
}
