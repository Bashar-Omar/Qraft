# 02 — Feature Matrix

Priority:

- **P0** public v1
- **P1** strong v1.x/stretch
- **P2** later
- **R&D** validate first

## Generate / payloads

| Feature              | Priority | Notes                           |
| -------------------- | -------: | ------------------------------- |
| URL                  |       P0 | normalize/validate scheme       |
| Text                 |       P0 | byte/density feedback           |
| Email                |       P0 | `mailto:`                       |
| Phone                |       P0 | `tel:`                          |
| SMS                  |       P0 | recipient + body                |
| WhatsApp             |       P0 | number + message                |
| Wi‑Fi                |       P0 | SSID/security/password/hidden   |
| vCard                |       P0 | robust escaping                 |
| Event                |       P0 | iCalendar                       |
| Location             |       P0 | geo                             |
| Raw payload          |       P0 | power-user escape hatch         |
| App links            |       P1 | curated link helper             |
| Social/profile links |       P1 | links, not hosted landing pages |
| OTP provisioning     |       P1 | sensitive/local-only warning    |
| Crypto URI           |       P1 | protocol-aware                  |
| GS1 Digital Link     |       P1 | structured advanced editor      |
| EPC payment          |       P2 | only with spec tests            |
| Swiss QR             |       P2 | dedicated domain validation     |

## QR design

| Feature                       | Priority |
| ----------------------------- | -------: |
| foreground/background         |       P0 |
| transparent background        |       P0 |
| gradients                     |       P0 |
| module/body styles            |       P0 |
| eye frame/dot styles          |       P0 |
| local logo upload             |       P0 |
| logo size/padding             |       P0 |
| ECC recommendation            |       P0 |
| quiet-zone controls           |       P0 |
| visual presets                |       P0 |
| frame/CTA labels              |       P1 |
| local style presets           |       P1 |
| undo/redo                     |       P1 |
| preview on light/dark/checker |       P0 |

## Barcode studio

P0 curated:

- Code 128,
- Code 39/93,
- EAN-13/EAN-8,
- UPC-A/UPC-E,
- ITF/ITF-14,
- Data Matrix,
- PDF417,
- Aztec,
- common QR variants after tests.

P0 Expert Mode:

- searchable renderer-backed catalog for long-tail formats.

P1:

- GS1 families,
- DataBar,
- ISBN/ISSN/ISMN helpers,
- postal/specialty catalog metadata.

P2:

- healthcare/HIBC polished workflows,
- raw advanced renderer options.

## Scanner/inspector

P0:

- camera,
- image upload,
- native detector fast path,
- ZXing fallback,
- camera selector,
- raw result,
- parsed URL/Wi‑Fi/vCard/etc.,
- copy,
- explicit safe Open action,
- generate-from-scan,
- current-code self-test.

P1:

- clipboard image,
- torch where supported,
- current-session history.

## Quality Assistant

P0:

- quiet-zone rule,
- contrast heuristic,
- ECC visibility,
- density/version info,
- logo occlusion heuristic,
- transparency/inversion warning,
- self-decode test,
- physical print-size helper.

P1:

- transparent explainable score or Good/Check/Risk summary,
- multi-scale stress test.

Never call the heuristic a certification.

## Export

P0:

- SVG,
- PNG,
- JPEG,
- WebP,
- PDF,
- ZIP for batch.

P1:

- copy SVG markup,
- copy image,
- data URI,
- physical unit controls,
- label sheets.

P2:

- EPS after reliable vector pipeline validation.

## Batch

P0:

- CSV import,
- template,
- column mapping,
- row validation,
- error filtering,
- sample preview,
- common design preset,
- filename template,
- SVG/PNG ZIP,
- progress + cancel.

P1:

- PDF sheet,
- large-job worker tuning,
- saved local mappings.

## Portable projects

P0:

- export/import `.qraft.json`,
- schema version,
- migration mechanism.

P1:

- embedded small logo,
- named local presets.

P2:

- non-sensitive share-by-URL config.

## Product polish

P0:

- light/dark/system,
- responsive studio,
- sticky mobile download,
- designed empty/error states,
- accessible focus.

P1:

- command palette,
- keyboard shortcuts,
- richer contextual guides.

P2:

- PWA/offline install,
- browser extension.

## Explicitly excluded from core

- hosted dynamic redirects,
- scan tracking/location analytics,
- cloud history,
- user accounts,
- subscriptions.
