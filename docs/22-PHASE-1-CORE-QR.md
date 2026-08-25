# 22 — Phase 1 Core QR implementation

## Status

Phase 1 is intentionally split into vertical slices.

**Phase 1A** establishes one complete production path from payload intent to downloadable QR artifact. It does not attempt to expose every payload format in the catalog.

## Phase 1A scope

Implemented:

- Qraft-owned `PayloadCodec` and payload definition contracts,
- payload registry with duplicate-id protection,
- URL payload codec,
- plain Text payload codec,
- Qraft-owned QR render request/result contracts,
- standards-first `StandardQrRenderer`,
- `qr@0.6.0` isolated behind the renderer adapter,
- safe Medium ECC default,
- fixed four-module quiet-zone baseline,
- normalized Qraft-owned matrix and render metadata,
- live browser preview,
- SVG exporter,
- crisp canvas PNG exporter,
- URL/Text studio editors,
- ECC L/M/Q/H control,
- unit tests and a UTF-8 render→decode regression vector,
- Playwright coverage for generation, payload switching and downloads.

Deferred to Phase 1B:

- Email,
- Phone,
- SMS,
- Wi-Fi,
- broader payload-specific fixtures,
- an independent decode implementation/device matrix.

Deferred beyond Phase 1:

- logo overlay,
- dot/eye styling,
- gradients,
- decorative frames,
- designer QR engine,
- scanner surface,
- batch generation.

## Dependency decision

The safe renderer uses `qr@0.6.0`.

The package was selected for this baseline because it is small, zero-dependency, TypeScript-native, exposes raw matrices, supports QR generation/decoding, and had a recent 0.6.0 audit/hardening release.

This dependency is an implementation detail. No `qr` vendor type crosses into the payload, application, export or UI domains.

## Pipeline

```text
User input
   ↓
PayloadRegistry
   ↓
PayloadCodec.parseInput / encode
   ↓
GenerateCode use case
   ↓
CodeRenderer port
   ↓
StandardQrRenderer adapter
   ↓
Qraft matrix + metadata
   ├── Live preview
   ├── SVG exporter
   └── PNG exporter
```

## Payload behavior

### URL

- trims outer whitespace,
- validates locally with the browser/Node URL parser,
- accepts HTTP/HTTPS in the curated editor,
- adds `https://` when a scheme is omitted,
- never fetches or resolves the destination during generation.

### Text

- preserves entered content exactly, including line breaks and Unicode,
- rejects effectively empty content,
- does not reinterpret the text as another payload type.

## Safe QR baseline

Phase 1A deliberately exposes a restrained standard profile:

- black modules on white,
- four-module quiet zone,
- explicit L/M/Q/H ECC,
- Medium (`M`) default,
- no logo occlusion,
- no styling that can reduce finder/timing readability.

Creative styling arrives only after this path is stable.

## Export behavior

SVG is produced from Qraft's normalized matrix instead of re-exporting a vendor SVG object.

PNG is rasterized from the same normalized matrix using integer module pixels and disabled image smoothing. This keeps the two export paths aligned with the live preview and prevents fractional-module blur.

## Test strategy

### Unit/domain

- URL validation/normalization,
- Text preservation and validation,
- registry behavior,
- matrix-to-path conversion,
- render metadata and quiet-zone invariants.

### Golden software regression

A UTF-8 payload is rendered to the normalized matrix and decoded back to the original payload.

This catches regressions in encoding, matrix normalization and payload byte handling. Because the current decoder comes from the same package as the encoder, this is explicitly **not** treated as independent certification.

### Browser E2E

Playwright runs the same Core QR smoke suite in desktop Chromium and a mobile Chromium device profile. It verifies:

- the Core QR studio is reachable,
- URL normalization is surfaced,
- a live QR appears,
- SVG and PNG downloads are emitted with expected filenames,
- Text and ECC controls update the studio,
- theme persistence remains intact.

## Phase 1A gate

Before merge:

```text
pnpm install --frozen-lockfile
pnpm format
.\scripts\verify.ps1
```

The PR must also pass the protected-main GitHub CI checks.

## Next slice — Phase 1B

The next slice should expand payload breadth through the existing registry rather than add conditions to the renderer:

1. Email codec/editor,
2. Phone codec/editor,
3. SMS codec/editor,
4. Wi-Fi codec/editor with correct escaping and security modes,
5. golden fixtures for each payload,
6. independent decode coverage and mobile/accessibility hardening.
