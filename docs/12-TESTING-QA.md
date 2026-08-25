# 12 — Testing & QA Strategy

## Philosophy

Barcode generation is deterministic enough for serious automated testing. Use that as a portfolio strength.

Do more than component snapshots.

## Layers

### Unit

- codecs,
- escaping,
- schemas,
- filenames,
- size math,
- quality rules,
- registry,
- project migration.

### Contract

Shared renderer/decoder/exporter behavior.

### Golden vectors

Known payload/config → code → expected metadata and decode round-trip where supported.

### Component

- picker,
- form,
- export,
- quality.

### E2E

- URL QR → export,
- Wi‑Fi,
- styled/logo QR,
- common 1D barcode,
- Data Matrix/PDF417,
- uploaded scan,
- batch CSV → ZIP,
- project import/export,
- mobile flow.

## Golden vectors

Use fake safe values:

```text
URL:
https://example.com

Wi-Fi:
SSID Qraft Lab
password example-only

EAN:
known valid test identifier

Unicode QR:
Arabic + Khmer + emoji

Long payload:
chosen density boundary
```

Never use real secrets.

## Round-trip test

```text
encode
→ render
→ rasterize
→ decode
→ decoded raw == encoded raw
```

This is a major quality gate.

## Visual regression

Playwright screenshots:

- landing,
- Generate desktop,
- Generate mobile,
- dark mode,
- scanner result,
- Batch mapper,
- key overlay.

Keep the set stable and meaningful.

## Export tests

### SVG

- valid XML,
- expected viewBox,
- no script/event handlers,
- dimensions,
- quiet-zone bounds.

### Raster

- MIME/signature,
- dimensions,
- alpha expectation.

### PDF

- parseable,
- page count/size,
- vector/raster behavior as intended.

### ZIP

- expected files,
- manifest,
- no path traversal.

## Property/fuzz candidates

- Wi‑Fi escaping,
- vCard special chars,
- filename sanitizer,
- identifier validators,
- project parser.

Use only where it adds value.

## Browser matrix

At minimum:

- Chromium,
- Firefox,
- WebKit/Playwright,
- manual iOS Safari camera,
- manual Android Chrome camera.

Camera behavior needs physical-device testing.

## Accessibility

Automated axe:

- landing,
- generator,
- picker,
- export,
- scanner result.

Manual:

- focus trap/return,
- keyboard sliders,
- screen-reader announcements.

## Performance benchmarks

Track:

- first render,
- update latency,
- 100-code batch,
- 1000-code batch P1,
- 2048/4096 raster,
- scanner startup.

Set thresholds after baseline.

## CI gates

PR:

1. frozen install,
2. lint,
3. typecheck,
4. unit/contract,
5. production build,
6. Playwright smoke.

Nightly/optional:

- full browser matrix,
- extended catalog vectors,
- large batch benchmarks.

## Release QA

- all P0 fixtures,
- sample exports open in target apps,
- physical scan on two phones,
- mobile forms/keyboard,
- themes,
- no console errors,
- camera closes cleanly,
- no payload in network/analytics,
- performance review,
- dependency/license review.
