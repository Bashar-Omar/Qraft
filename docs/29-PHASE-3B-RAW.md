# Phase 3B — Step 2/3: Raw Payload Mode

## Status

This is the second implementation step in the current three-step local development cycle. Step 1 added RFC 5545 Event support. Step 2 adds an exact Raw payload escape hatch. Step 3 performs the Phase 3B integration/hardening gate before the branch is pushed.

## Product boundary

Raw mode exists for advanced users who already know the exact payload string they want inside the QR symbol.

Qraft does **not**:

- trim leading/trailing whitespace,
- normalize URLs,
- interpret schemes,
- serialize a structured format,
- rewrite line endings,
- merge arbitrary renderer options,
- execute or inject payload content into HTML/SVG.

The payload string is passed unchanged from the validated Raw codec to the existing QR render request.

## Why Raw is separate from Text

The curated Text payload is a friendly plain-text workflow. Raw mode is explicitly an escape hatch:

```text
Raw editor
  ↓
exact UTF-8 string
  ↓
Raw PayloadCodec
  ↓
existing Generate use case
  ↓
existing QR renderer
```

The separation gives Qraft room to keep Text user-friendly while Raw remains transparent about bytes, control characters and renderer limits.

## UTF-8 and byte pressure

JavaScript string length is not encoded byte length. Raw mode therefore measures with the Web Platform `TextEncoder`, whose output is UTF-8.

The editor shows:

- UTF-8 byte count,
- Unicode code-point count,
- selected-ECC Version 40 byte-mode ceiling,
- a descriptive byte-pressure band.

This is **capacity guidance**, not scanner certification.

Qraft's current QR adapters intentionally render in QR byte mode. For Version 40, DENSO WAVE documents the following binary capacities:

| ECC | Maximum byte-mode payload |
| --- | ------------------------: |
| L   |                2953 bytes |
| M   |                2331 bytes |
| Q   |                1663 bytes |
| H   |                1273 bytes |

The Raw codec rejects content above the absolute Version 40-L byte-mode ceiling because the current QR pipeline cannot represent it at any supported ECC. A payload below that absolute ceiling can still be too large for the currently selected ECC; the editor exposes that before the renderer's capacity error becomes the last line of defense.

## Exactness and controls

Whitespace-only content is valid Raw content because trimming would violate the exact-mode contract. Only a truly empty string is rejected.

Tab, CR and LF are preserved. Other C0/DEL control characters are also preserved, but the UI surfaces a warning because downstream scanner/display behavior can vary.

## Project compatibility

The project schema remains v1. `raw` is added to the supported payload-id allow-list and the original draft object is stored as JSON:

```json
{
  "id": "raw",
  "input": {
    "value": "  exact payload\n"
  }
}
```

Project import validates the content through the current Raw codec, and save/open must preserve the exact string.

## Architecture

The byte-capacity table lives in Qraft-owned core policy (`core/code/qr-capacity.ts`) rather than React. The editor receives a small render context containing the current QR ECC so it can display capacity pressure without importing renderer/vendor implementation details.

No vendor package types enter the payload codec or editor.

## Security

Raw means exact **data**, not arbitrary execution.

Raw mode never exposes:

- JavaScript execution,
- raw HTML rendering,
- raw SVG injection,
- arbitrary vendor renderer configuration,
- unsafe object merging.

Payload content remains data passed through the same local QR renderer and isolated canonical SVG/export pipeline used by every other payload.

## Step 2 gate

Automated coverage includes:

- exact whitespace/Unicode/line-ending preservation,
- whitespace-only payload acceptance,
- empty input rejection,
- UTF-8 byte vs code-point measurement,
- control-character disclosure metrics,
- Version 40 byte-mode ceiling enforcement,
- ECC capacity-pressure policy,
- QR golden exact round-trip,
- `.qraft.json` Raw exact round-trip,
- desktop/mobile Raw editor, self-test and project-export E2E coverage.

Full repository verification remains mandatory on the user's Windows workspace before Step 2 is accepted.

## Phase 3B integration note

Step 3 extracts shared payload text metrics from Raw-specific code and uses preferred-type inspection so Raw remains exact instead of being auto-classified as generic Text. Final acceptance remains contingent on the complete three-step repository gate.
