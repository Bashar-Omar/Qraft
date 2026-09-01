# Phase 4C — First Live Barcode Studio Slice

Date: 2026-08-31

## Outcome

Phase 4C turns the Phase 4B engine proof into a product-complete first barcode slice without expanding Qraft into an uncontrolled 100+ format catalog.

Live curated symbologies:

- Code 128
- Data Matrix

## Product boundary

`/generate` now exposes two progressive-disclosure workspaces:

1. QR Studio — existing payload/design/quality workflow.
2. Barcode Studio — standards-oriented barcode content and only capability-valid controls.

The barcode workspace is mounted lazily after first use so the existing QR path does not eagerly load BWIP.

## Capability-driven UI

Controls derive from `SymbologyDefinition.capabilities`.

- Code 128 exposes Human Readable Text.
- Data Matrix does not expose HRT.
- neither exposes QR logo, gradient or ECC controls.
- both retain vector/raster export and quiet-zone metadata.

## Final-artifact verification

Barcode self-test is independent from the BWIP encoder:

1. render canonical SVG through BWIP adapter,
2. rasterize the final SVG in-browser,
3. decode with `@zxing/library` MultiFormatReader restricted to the expected format,
4. compare decoded payload with Qraft's validated payload.

This is a regression/quality signal, not scanner certification.

## Portable project schema v2

Schema v2 introduces separate unions for content and representation.

QR:

```text
content.kind = payload
code.symbology = qr
```

Barcode:

```text
content.kind = barcode
code.symbology = code128 | datamatrix
```

Schema v1 remains importable through an explicit v1 -> v2 migration. Qraft never silently reinterprets a v1 document as a different schema.

## Export

The Export panel now reports actual width × height for every artifact. QR preserves integer pixels-per-module sizing; rectangular barcodes preserve canonical aspect ratio without square stretching.

## Gate

This step is complete only when:

- Code 128 and Data Matrix are Live in registry/UI,
- both render and export canonical SVG/raster artifacts,
- independent browser self-test passes representative vectors,
- schema-v2 QR and barcode project round-trips pass,
- schema-v1 QR migration passes,
- desktop/mobile E2E covers barcode generation, capability hiding, project persistence and invalid input,
- full repository CI is green.

## Next Phase 4 cycle

Expand curated breadth in controlled families:

1. Code 39 / Code 93 / ITF,
2. EAN-13 / EAN-8 / UPC-A / UPC-E with strict retail validation,
3. PDF417 / Aztec,
4. tested Micro QR / rMQR,
5. searchable Expert Catalog only after metadata/validation/golden coverage exists.
