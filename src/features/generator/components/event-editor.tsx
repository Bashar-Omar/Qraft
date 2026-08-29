import type { ChangeEvent } from "react";

import {
  createEventDtstamp,
  type EventPayloadInput,
  type EventTimeMode,
} from "@/core/payload/codecs/event.codec";
import {
  getPayloadFieldIssue,
  type PayloadEditorProps,
} from "@/features/generator/components/payload-editor.types";

const EMPTY_DRAFT: EventPayloadInput = {
  title: "",
  allDay: false,
  startDate: "",
  endDate: "",
  startDateTime: "",
  endDateTime: "",
  timeMode: "floating",
  location: "",
  description: "",
  url: "",
  uid: "",
  dtstamp: "",
};

function readDraft(value: unknown): EventPayloadInput {
  if (typeof value !== "object" || value === null) return EMPTY_DRAFT;
  const record = value as Record<string, unknown>;
  const read = (key: keyof EventPayloadInput) =>
    typeof record[key] === "string" ? (record[key] as string) : "";

  return {
    title: read("title"),
    allDay: record.allDay === true,
    startDate: read("startDate"),
    endDate: read("endDate"),
    startDateTime: read("startDateTime"),
    endDateTime: read("endDateTime"),
    timeMode: record.timeMode === "utc" ? "utc" : "floating",
    location: read("location"),
    description: read("description"),
    url: read("url"),
    uid: read("uid"),
    dtstamp: read("dtstamp"),
  };
}

export function EventEditor({ value, issues, onChange }: PayloadEditorProps) {
  const draft = readDraft(value);
  const issue = (field: keyof EventPayloadInput) => getPayloadFieldIssue(issues, field);
  const update = (patch: Partial<EventPayloadInput>) =>
    onChange({ ...draft, ...patch, dtstamp: createEventDtstamp() });

  const toggleAllDay = (allDay: boolean) => {
    if (allDay) {
      update({
        allDay: true,
        timeMode: "floating",
        startDate: draft.startDate || draft.startDateTime.slice(0, 10),
        endDate: draft.endDate || draft.endDateTime.slice(0, 10),
      });
      return;
    }

    update({
      allDay: false,
      startDateTime: draft.startDateTime || (draft.startDate ? `${draft.startDate}T09:00` : ""),
      endDateTime: draft.endDateTime || (draft.endDate ? `${draft.endDate}T10:00` : ""),
    });
  };

  return (
    <div className="studio-fields-grid">
      <div className="studio-field studio-field--full">
        <label htmlFor="payload-event-title">Event title</label>
        <input
          aria-describedby="payload-event-title-issue"
          aria-invalid={Boolean(issue("title"))}
          id="payload-event-title"
          onChange={(event: ChangeEvent<HTMLInputElement>) => update({ title: event.target.value })}
          placeholder="Qraft launch review"
          type="text"
          value={draft.title}
        />
        <p className="studio-field__issue" id="payload-event-title-issue" role="status">
          {issue("title") ?? ""}
        </p>
      </div>

      <label className="studio-checkbox studio-field--full" htmlFor="payload-event-all-day">
        <input
          checked={draft.allDay}
          id="payload-event-all-day"
          onChange={(event: ChangeEvent<HTMLInputElement>) => toggleAllDay(event.target.checked)}
          type="checkbox"
        />
        <span>
          <strong>All-day event</strong>
          <small>
            Qraft converts the inclusive end date to iCalendar&apos;s non-inclusive DTEND.
          </small>
        </span>
      </label>

      {draft.allDay ? (
        <>
          <div className="studio-field">
            <label htmlFor="payload-event-start-date">Start date</label>
            <input
              aria-describedby="payload-event-start-date-issue"
              aria-invalid={Boolean(issue("startDate"))}
              id="payload-event-start-date"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                update({ startDate: event.target.value })
              }
              type="date"
              value={draft.startDate}
            />
            <p className="studio-field__issue" id="payload-event-start-date-issue" role="status">
              {issue("startDate") ?? ""}
            </p>
          </div>

          <div className="studio-field">
            <label htmlFor="payload-event-end-date">End date</label>
            <input
              aria-describedby="payload-event-end-date-issue"
              aria-invalid={Boolean(issue("endDate"))}
              id="payload-event-end-date"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                update({ endDate: event.target.value })
              }
              type="date"
              value={draft.endDate}
            />
            <p className="studio-field__issue" id="payload-event-end-date-issue" role="status">
              {issue("endDate") ?? ""}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="studio-field">
            <label htmlFor="payload-event-start-time">Start</label>
            <input
              aria-describedby="payload-event-start-time-issue"
              aria-invalid={Boolean(issue("startDateTime"))}
              id="payload-event-start-time"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                update({ startDateTime: event.target.value })
              }
              type="datetime-local"
              value={draft.startDateTime}
            />
            <p className="studio-field__issue" id="payload-event-start-time-issue" role="status">
              {issue("startDateTime") ?? ""}
            </p>
          </div>

          <div className="studio-field">
            <label htmlFor="payload-event-end-time">End</label>
            <input
              aria-describedby="payload-event-end-time-issue"
              aria-invalid={Boolean(issue("endDateTime"))}
              id="payload-event-end-time"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                update({ endDateTime: event.target.value })
              }
              type="datetime-local"
              value={draft.endDateTime}
            />
            <p className="studio-field__issue" id="payload-event-end-time-issue" role="status">
              {issue("endDateTime") ?? ""}
            </p>
          </div>

          <div className="studio-field studio-field--full">
            <label htmlFor="payload-event-time-mode">Time basis</label>
            <select
              aria-describedby="payload-event-time-mode-hint"
              id="payload-event-time-mode"
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                update({ timeMode: event.target.value as EventTimeMode })
              }
              value={draft.timeMode}
            >
              <option value="floating">Floating local time</option>
              <option value="utc">UTC — fixed instant</option>
            </select>
            <p className="studio-field__hint" id="payload-event-time-mode-hint">
              Floating time keeps the entered wall-clock value. UTC represents one fixed instant.
              Named TZID events are intentionally deferred until Qraft can emit a complete VTIMEZONE
              definition instead of an incomplete timezone reference.
            </p>
          </div>
        </>
      )}

      <div className="studio-field studio-field--full">
        <label htmlFor="payload-event-location">Location</label>
        <input
          aria-describedby="payload-event-location-issue"
          aria-invalid={Boolean(issue("location"))}
          id="payload-event-location"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ location: event.target.value })
          }
          placeholder="Studio A"
          type="text"
          value={draft.location}
        />
        <p className="studio-field__issue" id="payload-event-location-issue" role="status">
          {issue("location") ?? ""}
        </p>
      </div>

      <div className="studio-field studio-field--full">
        <label htmlFor="payload-event-url">Event URL</label>
        <input
          aria-describedby="payload-event-url-issue"
          aria-invalid={Boolean(issue("url"))}
          id="payload-event-url"
          onChange={(event: ChangeEvent<HTMLInputElement>) => update({ url: event.target.value })}
          placeholder="https://example.com/event"
          spellCheck={false}
          type="url"
          value={draft.url}
        />
        <p className="studio-field__issue" id="payload-event-url-issue" role="status">
          {issue("url") ?? ""}
        </p>
      </div>

      <div className="studio-field studio-field--full studio-field--compact">
        <label htmlFor="payload-event-description">Description</label>
        <textarea
          aria-describedby="payload-event-description-hint payload-event-description-issue"
          aria-invalid={Boolean(issue("description"))}
          id="payload-event-description"
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            update({ description: event.target.value })
          }
          placeholder="Optional event notes"
          value={draft.description}
        />
        <p className="studio-field__hint" id="payload-event-description-hint">
          Event details stay in browser memory. Qraft emits RFC 5545 CRLF lines, TEXT escaping and
          UTF-8-safe 75-octet folding.
        </p>
        <p className="studio-field__issue" id="payload-event-description-issue" role="status">
          {issue("description") ?? ""}
        </p>
      </div>
    </div>
  );
}
