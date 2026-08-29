import {
  PayloadValidationError,
  type PayloadCodec,
  type PayloadDefinition,
  type PayloadIssue,
} from "@/core/payload/payload";
import { urlCodec } from "@/core/payload/codecs/url.codec";

export type EventTimeMode = "floating" | "utc";

export type EventPayloadInput = Readonly<{
  title: string;
  allDay: boolean;
  startDate: string;
  endDate: string;
  startDateTime: string;
  endDateTime: string;
  timeMode: EventTimeMode;
  location: string;
  description: string;
  url: string;
  uid: string;
  dtstamp: string;
}>;

export type EventPayloadData = EventPayloadInput;

const MAX_TITLE_LENGTH = 300;
const MAX_LOCATION_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_UID_LENGTH = 255;
const encoder = new TextEncoder();

function createUid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `urn:uuid:${globalThis.crypto.randomUUID()}`;
  }

  const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16] ?? "0", 16) & 0x3) | 0x8).toString(16);
  const uuid = `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
  return `urn:uuid:${uuid}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatUtcStamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours(),
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function formatLocalDateTimeInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function createEventDtstamp(date = new Date()): string {
  return formatUtcStamp(date);
}

export function createEventInitialInput(now = new Date()): EventPayloadInput {
  const start = new Date(now);
  start.setSeconds(0, 0);
  start.setMinutes(0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    title: "Qraft event",
    allDay: false,
    startDate: "",
    endDate: "",
    startDateTime: formatLocalDateTimeInput(start),
    endDateTime: formatLocalDateTimeInput(end),
    timeMode: "floating",
    location: "",
    description: "",
    url: "",
    uid: createUid(),
    dtstamp: formatUtcStamp(now),
  };
}

function readInput(input: unknown): EventPayloadInput {
  if (typeof input !== "object" || input === null) {
    throw new PayloadValidationError("Enter event details.", [
      { field: "title", message: "Event title is required." },
    ]);
  }

  const record = input as Record<string, unknown>;
  const readString = (key: keyof EventPayloadInput) =>
    typeof record[key] === "string" ? (record[key] as string) : "";

  return {
    title: readString("title"),
    allDay: record.allDay === true,
    startDate: readString("startDate"),
    endDate: readString("endDate"),
    startDateTime: readString("startDateTime"),
    endDateTime: readString("endDateTime"),
    timeMode: record.timeMode === "utc" ? "utc" : "floating",
    location: readString("location"),
    description: readString("description"),
    url: readString("url"),
    uid: readString("uid"),
    dtstamp: readString("dtstamp"),
  };
}

function isSupportedCalendarYear(year: number): boolean {
  return Number.isInteger(year) && year >= 1000 && year <= 9999;
}

function isValidUtcStamp(value: string): boolean {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (!isSupportedCalendarYear(year) || hour > 23 || minute > 59 || second > 59) return false;
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  );
}

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isSupportedCalendarYear(year)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isValidLocalDateTime(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (!isSupportedCalendarYear(year) || hour > 23 || minute > 59) return false;
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute
  );
}

function localDateTimeSortKey(value: string): number {
  return Number(value.replace(/[-:T]/g, ""));
}

function parseInput(input: unknown): EventPayloadData {
  const raw = readInput(input);
  const issues: PayloadIssue[] = [];
  const title = raw.title.trim();
  const location = raw.location.trim();
  const description = raw.description.trim();
  const uid = raw.uid.trim();
  const dtstamp = raw.dtstamp.trim().toUpperCase();
  let url = "";

  if (!title) {
    issues.push({ field: "title", message: "Event title is required." });
  } else if (title.length > MAX_TITLE_LENGTH) {
    issues.push({
      field: "title",
      message: `Keep the title under ${MAX_TITLE_LENGTH} characters.`,
    });
  }

  if (location.length > MAX_LOCATION_LENGTH) {
    issues.push({ field: "location", message: "The location is too long." });
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push({ field: "description", message: "The description is too long." });
  }

  if (!uid || uid.length > MAX_UID_LENGTH || /[\u0000-\u001f\u007f]/.test(uid)) {
    issues.push({ field: "uid", message: "The event identifier is missing or invalid." });
  }
  if (!isValidUtcStamp(dtstamp)) {
    issues.push({ field: "dtstamp", message: "The event revision timestamp is invalid." });
  }

  if (raw.url.trim()) {
    try {
      url = urlCodec.parseInput(raw.url).url;
    } catch {
      issues.push({ field: "url", message: "Enter a valid HTTP or HTTPS event URL." });
    }
  }

  if (raw.allDay) {
    if (!isValidCalendarDate(raw.startDate)) {
      issues.push({ field: "startDate", message: "Choose a valid start date." });
    }
    if (!isValidCalendarDate(raw.endDate)) {
      issues.push({ field: "endDate", message: "Choose a valid end date." });
    } else if (raw.endDate === "9999-12-31") {
      issues.push({ field: "endDate", message: "Choose an end date before 9999-12-31." });
    }
    if (
      isValidCalendarDate(raw.startDate) &&
      isValidCalendarDate(raw.endDate) &&
      raw.endDate < raw.startDate
    ) {
      issues.push({ field: "endDate", message: "End date cannot be before start date." });
    }
  } else {
    if (!isValidLocalDateTime(raw.startDateTime)) {
      issues.push({ field: "startDateTime", message: "Choose a valid start date and time." });
    }
    if (!isValidLocalDateTime(raw.endDateTime)) {
      issues.push({ field: "endDateTime", message: "Choose a valid end date and time." });
    }
    if (
      isValidLocalDateTime(raw.startDateTime) &&
      isValidLocalDateTime(raw.endDateTime) &&
      localDateTimeSortKey(raw.endDateTime) <= localDateTimeSortKey(raw.startDateTime)
    ) {
      issues.push({ field: "endDateTime", message: "End time must be after start time." });
    }
  }

  if (issues.length > 0) {
    throw new PayloadValidationError("Check the event details.", issues);
  }

  return {
    title,
    allDay: raw.allDay,
    startDate: raw.allDay ? raw.startDate : "",
    endDate: raw.allDay ? raw.endDate : "",
    startDateTime: raw.allDay ? "" : raw.startDateTime,
    endDateTime: raw.allDay ? "" : raw.endDateTime,
    timeMode: raw.allDay ? "floating" : raw.timeMode,
    location,
    description,
    url,
    uid,
    dtstamp,
  };
}

function compactDate(value: string): string {
  return value.replace(/-/g, "");
}

function compactDateTime(value: string): string {
  return `${value.replace(/[-:]/g, "")}00`;
}

function parseCompactDate(value: string): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (!match) return null;
  const result = `${match[1]}-${match[2]}-${match[3]}`;
  return isValidCalendarDate(result) ? result : null;
}

function parseCompactDateTime(value: string): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (!match || match[6] !== "00") return null;
  const result = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
  return isValidLocalDateTime(result) ? result : null;
}

function addDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function unescapeText(value: string): string {
  let output = "";
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== "\\" || index === value.length - 1) {
      output += char;
      continue;
    }
    const next = value[index + 1];
    index += 1;
    output += next === "n" || next === "N" ? "\n" : next;
  }
  return output;
}

function foldContentLine(line: string): string {
  const segments: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const char of line) {
    const charBytes = encoder.encode(char).byteLength;
    if (current && currentBytes + charBytes > limit) {
      segments.push(current);
      current = char;
      currentBytes = charBytes;
      limit = 74;
    } else {
      current += char;
      currentBytes += charBytes;
    }
  }

  if (current || segments.length === 0) segments.push(current);
  return segments.map((segment, index) => (index === 0 ? segment : ` ${segment}`)).join("\r\n");
}

function unfoldLines(payload: string): string[] {
  return payload.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function parseProperty(
  line: string,
): Readonly<{ name: string; parameters: string[]; value: string }> | null {
  const colon = line.indexOf(":");
  if (colon < 0) return null;
  const left = line.slice(0, colon).split(";");
  return {
    name: (left.shift() ?? "").toUpperCase(),
    parameters: left.map((parameter) => parameter.toUpperCase()),
    value: line.slice(colon + 1),
  };
}

export const eventCodec: PayloadCodec<EventPayloadData> = {
  id: "event",
  parseInput,
  encode(data) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Qraft//Event QR//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${escapeText(data.uid)}`,
      `DTSTAMP:${data.dtstamp}`,
    ];

    if (data.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(data.startDate)}`);
      lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(data.endDate, 1))}`);
    } else {
      const suffix = data.timeMode === "utc" ? "Z" : "";
      lines.push(`DTSTART:${compactDateTime(data.startDateTime)}${suffix}`);
      lines.push(`DTEND:${compactDateTime(data.endDateTime)}${suffix}`);
    }

    lines.push(`SUMMARY:${escapeText(data.title)}`);
    if (data.location) lines.push(`LOCATION:${escapeText(data.location)}`);
    if (data.description) lines.push(`DESCRIPTION:${escapeText(data.description)}`);
    if (data.url) lines.push(`URL:${data.url}`);
    lines.push("END:VEVENT", "END:VCALENDAR");

    return `${lines.map(foldContentLine).join("\r\n")}\r\n`;
  },
  inspect(payload) {
    try {
      const lines = unfoldLines(payload.trim());
      if (
        lines[0]?.toUpperCase() !== "BEGIN:VCALENDAR" ||
        lines.at(-1)?.toUpperCase() !== "END:VCALENDAR"
      ) {
        return null;
      }

      let inEvent = false;
      let eventCount = 0;
      let version = "";
      let prodid = "";
      const seenEventProperties = new Set<string>();
      let uid = "";
      let dtstamp = "";
      let title = "";
      let location = "";
      let description = "";
      let url = "";
      let start: ReturnType<typeof parseProperty> = null;
      let end: ReturnType<typeof parseProperty> = null;

      for (const line of lines.slice(1, -1)) {
        const upper = line.toUpperCase();
        if (upper === "BEGIN:VEVENT") {
          if (inEvent) return null;
          eventCount += 1;
          if (eventCount > 1) return null;
          inEvent = true;
          continue;
        }
        if (upper === "END:VEVENT") {
          if (!inEvent) return null;
          inEvent = false;
          continue;
        }
        if (inEvent && (upper.startsWith("BEGIN:") || upper.startsWith("END:"))) return null;

        const property = parseProperty(line);
        if (!property) continue;
        if (!inEvent) {
          if (property.name === "VERSION") {
            if (version) return null;
            version = property.value;
          } else if (property.name === "PRODID") {
            if (prodid) return null;
            prodid = property.value;
          }
          continue;
        }

        if (property.parameters.some((parameter) => parameter.startsWith("TZID="))) return null;
        if (
          [
            "UID",
            "DTSTAMP",
            "DTSTART",
            "DTEND",
            "SUMMARY",
            "LOCATION",
            "DESCRIPTION",
            "URL",
          ].includes(property.name)
        ) {
          if (seenEventProperties.has(property.name)) return null;
          seenEventProperties.add(property.name);
        }

        if (property.name === "UID") uid = unescapeText(property.value);
        else if (property.name === "DTSTAMP") dtstamp = property.value.toUpperCase();
        else if (property.name === "DTSTART") start = property;
        else if (property.name === "DTEND") end = property;
        else if (property.name === "SUMMARY") title = unescapeText(property.value);
        else if (property.name === "LOCATION") location = unescapeText(property.value);
        else if (property.name === "DESCRIPTION") description = unescapeText(property.value);
        else if (property.name === "URL") url = property.value;
      }

      if (
        inEvent ||
        eventCount !== 1 ||
        version !== "2.0" ||
        !prodid ||
        !start ||
        !end ||
        !uid ||
        !dtstamp ||
        !title
      ) {
        return null;
      }

      const startIsDate = start.parameters.includes("VALUE=DATE");
      const endIsDate = end.parameters.includes("VALUE=DATE");
      if (startIsDate !== endIsDate) return null;

      let input: EventPayloadInput;
      if (startIsDate) {
        const startDate = parseCompactDate(start.value);
        const exclusiveEnd = parseCompactDate(end.value);
        if (!startDate || !exclusiveEnd || exclusiveEnd <= startDate) return null;
        input = {
          title,
          allDay: true,
          startDate,
          endDate: addDays(exclusiveEnd, -1),
          startDateTime: "",
          endDateTime: "",
          timeMode: "floating",
          location,
          description,
          url,
          uid,
          dtstamp,
        };
      } else {
        const startUtc = start.value.endsWith("Z");
        const endUtc = end.value.endsWith("Z");
        if (startUtc !== endUtc) return null;
        const startDateTime = parseCompactDateTime(
          startUtc ? start.value.slice(0, -1) : start.value,
        );
        const endDateTime = parseCompactDateTime(endUtc ? end.value.slice(0, -1) : end.value);
        if (!startDateTime || !endDateTime) return null;
        input = {
          title,
          allDay: false,
          startDate: "",
          endDate: "",
          startDateTime,
          endDateTime,
          timeMode: startUtc ? "utc" : "floating",
          location,
          description,
          url,
          uid,
          dtstamp,
        };
      }

      const data = parseInput(input);
      return { id: "event", data };
    } catch {
      return null;
    }
  },
};

const SAMPLE_EVENT_INPUT: EventPayloadInput = {
  title: "Qraft launch review",
  allDay: false,
  startDate: "",
  endDate: "",
  startDateTime: "2026-09-01T10:00",
  endDateTime: "2026-09-01T11:00",
  timeMode: "floating",
  location: "Studio A",
  description: "Review the next Qraft milestone.",
  url: "https://example.com/qraft-event",
  uid: "urn:uuid:00000000-0000-4000-8000-000000000001",
  dtstamp: "20260829T120000Z",
};

export const eventPayloadDefinition: PayloadDefinition<EventPayloadData> = {
  id: "event",
  label: "Event",
  description: "Create an RFC 5545 iCalendar event with explicit time semantics.",
  category: "popular",
  sampleInput: SAMPLE_EVENT_INPUT,
  createInitialInput: () => createEventInitialInput(),
  codec: eventCodec,
};
