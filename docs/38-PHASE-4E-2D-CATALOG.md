# 38 — Phase 4E: Curated 2D + Catalog Search Foundation

Status: **Step 2/3 implemented locally; Expert Catalog is next.**

## Goal

Finish the high-value curated 2D pair from the v1 barcode matrix while creating the Qraft-owned discovery layer that the long-tail Expert Catalog can safely reuse.

Phase 4D proved that adding formats is not only an engine mapping task: input semantics, canonical payloads, self-test and portable projects must agree before a format becomes Live. Phase 4E applies the same standard to PDF417 and Aztec Code, then moves catalog discovery out of React and into the symbology registry.

## Delivered

### PDF417

- stable Qraft ID `pdf417`, family `stacked`, tier `curated`, availability `live`,
- ISO-8859-1 / Latin-1 byte input only,
- conservative curated ceiling of 1108 bytes,
- ECI, Macro PDF417, raw codewords, fixed rows/columns and explicit EC tuning remain Expert-only,
- named `pdf417` BWIP encoder behind the existing lazy runtime,
- two-module Qraft clear area,
- ZXing `PDF_417` artifact self-test mapping,
- schema-v2 project import/export.

BWIPP documents PDF417 as a stacked-linear ISO/IEC 15438 symbology. Its default reader interpretation is ISO-8859-1; ECI is available when explicitly signaled. Qraft intentionally does not infer ECI from JavaScript Unicode strings.

### Aztec Code

- stable Qraft ID `aztec`, family `matrix`, tier `curated`, availability `live`,
- ISO-8859-1 / Latin-1 byte input only,
- curated ceiling of 1914 bytes at the standard recommended error-correction model,
- ECI, reader-init, raw bitstreams and fixed layer controls remain Expert-only,
- Qraft ID maps to BWIP named encoder `azteccode` only inside the adapter,
- zero required quiet-zone metadata rather than inventing a standards requirement,
- ZXing `AZTEC` artifact self-test mapping,
- schema-v2 project import/export.

ISO/IEC 24778:2024 describes Aztec as orientation-independent, with no required quiet zone and a largest-symbol byte capacity of 1914 bytes at the recommended error-correction level.

## Catalog discovery seam

`SymbologyDefinition` now owns searchable product metadata:

- aliases,
- family (`linear`, `matrix`, `stacked`),
- curated/expert/experimental tier,
- Live/Planned availability,
- domains,
- use-case keywords,
- summary,
- render capabilities.

`SymbologyRegistry.search()` can combine free-text query with family, tier, availability and domain filters. Search tokens match Qraft-owned metadata only; vendor symbol lists are never queried as a product catalog.

The Barcode Studio consumes this registry seam for a visible search box and All / Linear / Matrix / Stacked filtering. This is deliberately the same seam that Phase 4F Expert Catalog will extend.

## Architecture boundaries preserved

- `@bwip-js/browser` remains imported by one production runtime binding only.
- Vendor IDs remain adapter-local (`aztec` → `azteccode`).
- Project schema stays v2; this is additive symbology breadth, not a document-shape change.
- React does not own the search algorithm or domain tags.
- Human-readable-text controls remain capability-driven and are absent for PDF417/Aztec.
- Safe SVG validation and rectangular raster/export contracts remain unchanged.

## Verification added

- registry search tests for aliases/family/use cases,
- Latin-1 and byte-ceiling tests for PDF417/Aztec,
- adapter option/quiet-area tests,
- real `@bwip-js/browser` named-encoder integration tests,
- project parser/export/import round trips,
- lazy renderer coverage,
- desktop/mobile Playwright flow covering catalog search, Aztec/PDF417 preview, independent decode and project export.

## Research notes

Primary/current references reviewed for this step:

- BWIPP PDF417 documentation: https://github.com/bwipp/postscriptbarcode/wiki/PDF417
- BWIPP Aztec documentation: https://github.com/bwipp/postscriptbarcode/wiki/Aztec-Code
- bwip-js supported barcode list / named encoders: https://github.com/metafloor/bwip-js
- ISO/IEC 24778:2024 Aztec Code specification summary: https://www.iso.org/standard/82441.html
- ISO/IEC 15438:2015 PDF417 specification summary: https://www.iso.org/standard/65502.html
- ZXing JS supported formats / current package: https://github.com/zxing-js/library

ZXing JS 0.23.0 lists both Aztec and PDF417 as supported. Its PDF417 decoder uses `BigInt`, which is acceptable for Qraft's evergreen browser target but should remain part of compatibility QA.

## Next — Phase 4F / step 3 of 3

Build the first honest Expert Catalog slice on top of this metadata/search seam:

- renderer-backed Expert definitions separated from curated workflows,
- search/domain/family filters shared with the live catalog,
- allow-listed generic input only,
- explicit Expert/Experimental badges and support language,
- selected verified long-tail formats rather than exposing BWIP's complete symbol list blindly,
- full Node 24 / pnpm verification, Chromium/mobile E2E, patch-chain reproducibility, GitHub PR/CI and Vercel verification after the 3-step cycle closes.
