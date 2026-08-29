# Phase 3B — Step 1/3: Event / iCalendar

## Status

This is the first implementation step in the current three-step local development cycle. It adds the curated Event payload and deliberately does **not** push or merge anything yet. Step 1 is retained as a standards-focused record; Step 2 now adds Raw mode, and Step 3 performs the Phase 3B integration/hardening gate before the branch is pushed.

## Standards boundary

Qraft emits an RFC 5545 iCalendar object with one `VEVENT`:

```text
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Qraft//Event QR//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:...
DTSTAMP:...
DTSTART:...
DTEND:...
SUMMARY:...
...
END:VEVENT
END:VCALENDAR
```

The serializer uses:

- CRLF line endings,
- UTF-8-safe folding at 75 octets,
- RFC 5545 TEXT escaping for backslash, comma, semicolon and newlines,
- persistent UID metadata generated once for a new studio draft,
- a UTC `DTSTAMP` revision value that is refreshed when the event content changes.

## Date and time semantics

### All-day

The editor exposes an inclusive start and end date because that is the natural user mental model. RFC 5545 defines `DTEND` as non-inclusive, so Qraft encodes the day after the user-visible inclusive end date.

Example:

```text
User: September 1 through September 3
DTSTART;VALUE=DATE:20260901
DTEND;VALUE=DATE:20260904
```

Inspection performs the inverse conversion so a saved/decoded Qraft event returns to the same user-visible inclusive range.

### Timed / UTC

`UTC — fixed instant` appends `Z` to `DTSTART` and `DTEND`. The datetime-local control is explicitly interpreted as a UTC wall-clock value in this mode; Qraft does not silently apply the browser's local offset.

### Timed / floating

`Floating local time` emits a DATE-TIME without `Z` or `TZID`. RFC 5545 defines this as floating time: the same wall-clock value can be interpreted in the receiving calendar's current time zone.

### Named time zones

This slice intentionally does not emit `TZID=America/...` by itself. RFC 5545 requires a matching `VTIMEZONE` component for each referenced TZID. Qraft will not pretend that a bare TZID is complete timezone support. Named-zone generation remains deferred until the app has a tested VTIMEZONE strategy.

## Architecture

Event remains a normal payload codec:

```text
EventEditor
   ↓
EventPayloadInput
   ↓
PayloadCodec<EventPayloadData>
   ↓
payload registry
   ↓
existing Generate use case
   ↓
QR renderer / Quality Assistant / self-test / exporters / project file
```

One small registry seam was added: payload definitions may provide `createInitialInput()`. Existing payloads continue to use their static `sampleInput`; Event uses the factory to create a fresh UID/DTSTAMP once when the studio draft is initialized. The codec itself remains synchronous and deterministic for a given draft.

## Project compatibility

The project schema stays at v1 because its shape is unchanged. `event` is an additional supported `PayloadId`, and imported Event input is validated again through the current Event codec before it can reach the studio.

The hidden UID and DTSTAMP are normal JSON payload fields, so save/open preserves event identity and revision metadata without browser objects or server state.

## Security and privacy

Event details are treated as potentially sensitive. This slice:

- does not fetch the event URL,
- does not persist automatically,
- does not send event content to a server,
- does not allow arbitrary iCalendar properties or injected renderer configuration,
- validates bounded user-facing fields before serialization.

## Step 1 gate

Automated coverage includes:

- floating timed event encode/inspect,
- fixed UTC event encode/inspect,
- all-day non-inclusive `DTEND` conversion,
- Unicode 75-octet folding,
- invalid ordering/URL/revision rejection,
- canonical all-day time semantics and supported calendar-year bounds,
- explicit rejection of incomplete named-TZID or multi-VEVENT inspection,
- fresh UID metadata generation,
- QR golden decode round-trip,
- `.qraft.json` Event round-trip,
- desktop/mobile Playwright Event editor + self-test + project export.

Full repository verification remains mandatory on the user's Windows workspace before Step 1 is accepted.

## Phase 3B integration note

Step 3 reuses Event `inspect()` through the common application inspector and verifies Event classification in the live Generate preview. Final acceptance remains contingent on the complete three-step repository gate.
