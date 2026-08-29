import { describe, expect, it } from "vitest";

import {
  createEventInitialInput,
  eventCodec,
  type EventPayloadInput,
} from "@/core/payload/codecs/event.codec";
import { PayloadValidationError } from "@/core/payload/payload";

const TIMED_EVENT: EventPayloadInput = {
  title: "Qraft review",
  allDay: false,
  startDate: "",
  endDate: "",
  startDateTime: "2026-09-01T10:00",
  endDateTime: "2026-09-01T11:30",
  timeMode: "floating",
  location: "Studio A",
  description: "Review design, export; and quality.\nBring notes.",
  url: "https://example.com/event",
  uid: "urn:uuid:00000000-0000-4000-8000-000000000123",
  dtstamp: "20260829T120000Z",
};

describe("eventCodec", () => {
  it("encodes and inspects a floating RFC 5545 event", () => {
    const data = eventCodec.parseInput(TIMED_EVENT);
    const payload = eventCodec.encode(data);

    expect(payload).toContain("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n");
    expect(payload).toContain("DTSTART:20260901T100000\r\n");
    expect(payload).toContain("DTEND:20260901T113000\r\n");
    expect(payload).toContain("DESCRIPTION:Review design\\, export\\; and quality.\\nBring notes.");
    expect(eventCodec.inspect(payload)).toEqual({ id: "event", data });
  });

  it("uses UTC Z designators for fixed-instant timed events", () => {
    const data = eventCodec.parseInput({ ...TIMED_EVENT, timeMode: "utc" });
    const payload = eventCodec.encode(data);

    expect(payload).toContain("DTSTART:20260901T100000Z\r\n");
    expect(payload).toContain("DTEND:20260901T113000Z\r\n");
    expect(eventCodec.inspect(payload)?.data).toMatchObject({ timeMode: "utc" });
  });

  it("converts an inclusive all-day end date to RFC 5545 non-inclusive DTEND", () => {
    const data = eventCodec.parseInput({
      ...TIMED_EVENT,
      allDay: true,
      startDate: "2026-09-01",
      endDate: "2026-09-03",
      startDateTime: "",
      endDateTime: "",
    });
    const payload = eventCodec.encode(data);

    expect(payload).toContain("DTSTART;VALUE=DATE:20260901\r\n");
    expect(payload).toContain("DTEND;VALUE=DATE:20260904\r\n");
    expect(eventCodec.inspect(payload)?.data).toMatchObject({
      allDay: true,
      startDate: "2026-09-01",
      endDate: "2026-09-03",
    });
  });

  it("folds long Unicode content lines without exceeding 75 UTF-8 octets", () => {
    const title = `Qraft ${"مرحبا ".repeat(20)}👋`;
    const payload = eventCodec.encode(eventCodec.parseInput({ ...TIMED_EVENT, title }));
    const physicalLines = payload.split("\r\n").filter(Boolean);

    expect(physicalLines.every((line) => new TextEncoder().encode(line).byteLength <= 75)).toBe(
      true,
    );
    expect(eventCodec.inspect(payload)?.data).toMatchObject({ title });
  });

  it("rejects invalid ordering, URLs and revision metadata", () => {
    expect(() =>
      eventCodec.parseInput({
        ...TIMED_EVENT,
        endDateTime: "2026-09-01T09:00",
        url: "javascript:alert(1)",
        dtstamp: "20260230T120000Z",
      }),
    ).toThrow(PayloadValidationError);
  });

  it("canonicalizes all-day drafts to floating time semantics", () => {
    const data = eventCodec.parseInput({
      ...TIMED_EVENT,
      allDay: true,
      startDate: "2026-09-01",
      endDate: "2026-09-01",
      startDateTime: "",
      endDateTime: "",
      timeMode: "utc",
    });

    expect(data.timeMode).toBe("floating");
  });

  it("rejects multiple VEVENT components and unsupported calendar years", () => {
    const data = eventCodec.parseInput(TIMED_EVENT);
    const payload = eventCodec.encode(data);
    const duplicate = payload.replace(
      "END:VCALENDAR",
      payload.slice(
        payload.indexOf("BEGIN:VEVENT"),
        payload.indexOf("END:VEVENT") + "END:VEVENT".length,
      ) + "\r\nEND:VCALENDAR",
    );

    expect(eventCodec.inspect(duplicate)).toBeNull();
    expect(() =>
      eventCodec.parseInput({ ...TIMED_EVENT, startDateTime: "0099-01-01T10:00" }),
    ).toThrow(PayloadValidationError);
  });

  it("rejects duplicate required properties and unsupported nested components", () => {
    const payload = eventCodec.encode(eventCodec.parseInput(TIMED_EVENT));
    const duplicateUid = payload.replace(
      `UID:${TIMED_EVENT.uid}`,
      `UID:${TIMED_EVENT.uid}\r\nUID:${TIMED_EVENT.uid}`,
    );
    const nestedAlarm = payload.replace(
      "SUMMARY:Qraft review",
      "BEGIN:VALARM\r\nACTION:DISPLAY\r\nEND:VALARM\r\nSUMMARY:Qraft review",
    );

    expect(eventCodec.inspect(duplicateUid)).toBeNull();
    expect(eventCodec.inspect(nestedAlarm)).toBeNull();
  });

  it("rejects named TZID input until a complete VTIMEZONE can be emitted", () => {
    const payload = eventCodec
      .encode(eventCodec.parseInput(TIMED_EVENT))
      .replace("DTSTART:20260901T100000", "DTSTART;TZID=America/New_York:20260901T100000");

    expect(eventCodec.inspect(payload)).toBeNull();
  });

  it("creates fresh persistent metadata for a new event draft", () => {
    const now = new Date("2026-08-29T12:34:56Z");
    const first = createEventInitialInput(now);
    const second = createEventInitialInput(now);

    expect(first.dtstamp).toBe("20260829T123456Z");
    expect(first.uid).toMatch(
      /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(second.uid).not.toBe(first.uid);
  });
});
