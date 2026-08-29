# Phase 3A — Structured Payload Breadth

## Status

Phase 3A starts the Phase 3 payload-breadth roadmap with three high-value curated payloads that fit the existing QR pipeline cleanly:

- Contact / vCard 4.0,
- WhatsApp Click to Chat,
- Location / `geo:` URI.

No renderer or export dependency is added. Each payload is a Qraft-owned codec + editor and therefore automatically uses the existing safe QR renderer, designer adapter, Quality Assistant, self-test, raster/vector exporters and `.qraft.json` project system.

## Contact / vCard 4.0

Qraft uses the current IETF vCard format rather than a vendor-specific contact string. The curated profile includes:

- first and last name,
- organization,
- title,
- mobile phone,
- email,
- website.

The encoder emits CRLF-delimited vCard 4.0, escapes text values and folds long content lines on UTF-8 code-point boundaries so a multi-byte character is never split in the middle of its encoded octets.

The contact editor deliberately does not expose photos, arbitrary parameters or free-form vCard properties in this slice. Those features would expand both security and interoperability surface without improving the common QR contact workflow.

## WhatsApp

Qraft uses WhatsApp's documented `https://wa.me/<number>` Click to Chat format.

The phone number:

- must be a global `+` number in the editor,
- is normalized with the same Qraft phone-number utility already used by Phone/SMS,
- is emitted as digits only in the `wa.me` path.

Optional pre-filled text is encoded with `encodeURIComponent`. Inspection accepts only HTTPS `wa.me` links with the supported numeric path and optional `text` parameter; unrelated query parameters are rejected rather than silently copied.

## Location / RFC 5870

Location uses the standards-track `geo:` URI:

```text
geo:latitude,longitude[,altitude][;u=uncertainty]
```

Qraft validates:

- latitude: -90…90,
- longitude: -180…180,
- optional finite altitude in meters,
- optional non-negative uncertainty in meters,
- only the default WGS-84 CRS (an explicit `crs=wgs84` is accepted during inspection).

No map provider URL is baked into the payload, so the QR remains protocol-independent and the receiving device can choose its own location application.

## Architecture

```text
curated editor
    ↓
PayloadCodec<T>
    ↓
payload registry
    ↓
Generate use case
    ↓
existing QR render / quality / export / project path
```

This keeps payload semantics independent from QR styling and avoids per-feature renderer branches.

## Project compatibility

The `.qraft.json` v1 project parser now recognizes the three new `PayloadId` values. Input is still parsed into fresh JSON-domain values and then validated by the current payload codec on import. No schema migration is required because the document shape is unchanged; older Qraft builds will fail gracefully on an unknown payload id rather than unsafe-merging it.

## Testing gate

Phase 3A adds:

- codec unit tests for normalization, escaping and rejection paths,
- QR render/decode golden vectors for all three new payloads,
- desktop/mobile Playwright coverage that exercises all three curated editors and saves a Location project.

Phase 3B starts with a dedicated iCalendar Event slice, followed by Raw mode and a separate integration/hardening step before the branch is pushed. Event remains intentionally separated because RFC 5545 UID/DTSTAMP/time semantics require an explicit model rather than a quick string template.
