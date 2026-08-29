import type { ChangeEvent } from "react";

import type { LocationPayloadInput } from "@/core/payload/codecs/location.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const EMPTY_DRAFT: LocationPayloadInput = {
  latitude: "",
  longitude: "",
  altitude: "",
  uncertainty: "",
};

function readDraft(value: unknown): LocationPayloadInput {
  if (typeof value !== "object" || value === null) return EMPTY_DRAFT;
  const record = value as Record<string, unknown>;
  const read = (key: keyof LocationPayloadInput) =>
    typeof record[key] === "string" ? (record[key] as string) : "";
  return {
    latitude: read("latitude"),
    longitude: read("longitude"),
    altitude: read("altitude"),
    uncertainty: read("uncertainty"),
  };
}

export function LocationEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = readDraft(value);
  const update = (patch: Partial<LocationPayloadInput>) => onChange({ ...draft, ...patch });

  return (
    <div className="studio-fields-grid">
      <div className="studio-field">
        <label htmlFor="payload-location-latitude">Latitude</label>
        <input
          aria-describedby="payload-location-latitude-issue"
          aria-invalid={Boolean(getPayloadFieldIssue(issues, "latitude"))}
          id="payload-location-latitude"
          inputMode="decimal"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ latitude: event.target.value })
          }
          placeholder="30.0444"
          type="text"
          value={draft.latitude}
        />
        <p className="studio-field__issue" id="payload-location-latitude-issue" role="status">
          {getPayloadFieldIssue(issues, "latitude") ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-location-longitude">Longitude</label>
        <input
          aria-describedby="payload-location-longitude-issue"
          aria-invalid={Boolean(getPayloadFieldIssue(issues, "longitude"))}
          id="payload-location-longitude"
          inputMode="decimal"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ longitude: event.target.value })
          }
          placeholder="31.2357"
          type="text"
          value={draft.longitude}
        />
        <p className="studio-field__issue" id="payload-location-longitude-issue" role="status">
          {getPayloadFieldIssue(issues, "longitude") ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-location-altitude">Altitude · meters</label>
        <input
          aria-describedby="payload-location-altitude-hint payload-location-altitude-issue"
          aria-invalid={Boolean(getPayloadFieldIssue(issues, "altitude"))}
          id="payload-location-altitude"
          inputMode="decimal"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ altitude: event.target.value })
          }
          placeholder="Optional"
          type="text"
          value={draft.altitude}
        />
        <p className="studio-field__hint" id="payload-location-altitude-hint">
          Leave empty when altitude is unknown.
        </p>
        <p className="studio-field__issue" id="payload-location-altitude-issue" role="status">
          {getPayloadFieldIssue(issues, "altitude") ?? ""}
        </p>
      </div>

      <div className="studio-field">
        <label htmlFor="payload-location-uncertainty">Uncertainty · meters</label>
        <input
          aria-describedby="payload-location-uncertainty-hint payload-location-uncertainty-issue"
          aria-invalid={Boolean(getPayloadFieldIssue(issues, "uncertainty"))}
          id="payload-location-uncertainty"
          inputMode="decimal"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ uncertainty: event.target.value })
          }
          placeholder="Optional"
          type="text"
          value={draft.uncertainty}
        />
        <p className="studio-field__hint" id="payload-location-uncertainty-hint">
          RFC 5870 u= parameter; zero means an exact stated point.
        </p>
        <p className="studio-field__issue" id="payload-location-uncertainty-issue" role="status">
          {getPayloadFieldIssue(issues, "uncertainty") ?? ""}
        </p>
      </div>
    </div>
  );
}
