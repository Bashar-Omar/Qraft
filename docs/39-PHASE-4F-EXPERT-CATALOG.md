# Phase 4F — Honest Expert Catalog

## Status

Implemented locally as step 3/3 of the second Phase 4 cycle.

## Goal

Turn the Phase 4E catalog/search seam into Qraft's first real Expert Catalog without equating
BWIP renderer breadth with product support. Every visible format remains a Qraft-owned definition
with explicit input validation, support tier, capability metadata, project persistence and an
honest verification label.

## Support model

Qraft now exposes three product tiers:

- **Curated** — first-class workflows with Qraft validation and independent artifact self-test.
- **Expert** — allow-listed advanced formats. Some have independent ZXing artifact self-test;
  others are explicitly renderer-only.
- **Experimental** — deliberate opt-in where rendering is useful but verification coverage is not
  yet strong enough for an Expert claim.

`verification.artifactSelfTest` is part of `SymbologyDefinition`; the UI never infers verification
from family or renderer availability.

## First Expert slice

### Expert + renderer-only verification

- **Codabar** — A/B/C/D guards with an allow-listed body alphabet. Browser artifact decode is
  deliberately not claimed after the final Node 24 / Chromium gate showed the bundled ZXing
  Codabar path was not reliable for Qraft's generated artifact.
- **Code 11** — digits and hyphen only.
- **MSI Plessey** — digits only; checksum variants stay closed.
- **Plessey** — uppercase hexadecimal only.
- **Micro QR** — conservative 15-byte Latin-1 boundary, fixed ECC L and two-module clear margin.
  ZXing 0.23 ships a reader, but the upstream project still labels Micro-QR as needing testing, so
  Qraft keeps generation/export live without presenting an independent verification claim.
- **MaxiCode** — conservative unstructured Latin-1 workflow using ordinary automatic mode 4/5
  selection; structured carrier modes remain outside this generic workflow. ZXing 0.23 introduced
  MaxiCode decoding, but upstream still labels it as needing testing, so Qraft keeps this slice
  renderer-only until scanner/device evidence is strong enough to promote it.

All renderer-only formats still pass Qraft input validation and the safe SVG trust boundary, but
Qraft does not offer an independent self-test button for them.

### Experimental

- **rMQR** — conservative Latin-1 rendering through a fixed `R17x139` / ECC M BWIP profile, hidden
  unless the user deliberately enables Experimental formats. Independent artifact decoding is not
  claimed by the bundled decoder.

## Catalog UX

Barcode Studio discovery now supports:

- text search over Qraft-owned label/alias/summary/domain/use-case metadata,
- family filter,
- Curated/Expert support filter,
- domain filter,
- explicit `Include experimental` opt-in,
- visible support and verification badges per result.

A project that explicitly contains an Experimental symbology automatically reveals the
Experimental catalog state when opened, so a portable project never becomes invisible after a
valid import.

## Verification honesty

Formats with independent coverage keep the final-artifact pipeline:

```text
BWIP SVG
→ Qraft SVG validation
→ browser rasterization
→ ZXing decoder restricted to the expected format
→ exact payload comparison
```

The artifact decoder mirrors ZXing 0.23's browser strategy by retrying a `NotFoundException` with
`GlobalHistogramBinarizer` after the normal `HybridBinarizer` attempt for formats Qraft actually
marks as independently verified.

For renderer-only formats the Quality panel instead says `RENDER ONLY`; it does not expose a fake
or known-unreliable self-test control. Codabar, Micro QR and MaxiCode can be promoted later without
changing their renderer/project contracts once scanner-phase evidence is representative.

## Vendor boundary

The only production source that imports `@bwip-js/browser` remains
`src/engines/render/bwip/bwip-browser-runtime.ts`. New Qraft IDs map to named vendor encoders only
inside that adapter:

- `codabar` → `rationalizedCodabar`
- `code11` → `code11`
- `msi` → `msi`
- `plessey` → `plessey`
- `microqr` → `microqrcode`
- `maxicode` → `maxicode`
- `rmqr` → `rectangularmicroqrcode`

No vendor symbol list or raw option object crosses into core, project files or React UI.

## Portable projects

Schema v2 remains sufficient. The document envelope did not change; the allow-listed symbology ID
set expanded. Imported and exported Expert/Experimental projects are revalidated through current
Qraft policy exactly like Curated projects.

## Intentionally deferred

- exposing the complete 100+ BWIP symbol list,
- arbitrary renderer option maps,
- Code 11 / MSI checksum configuration,
- structured MaxiCode carrier modes 2/3,
- Unicode/ECI controls for the new 2D variants,
- rMQR promotion before independent decoder coverage and representative physical-device QA,
- GS1/DataBar/postal domain-specific workflows.

These remain additive future catalog work rather than reasons to weaken the Phase 4 product
boundary.
