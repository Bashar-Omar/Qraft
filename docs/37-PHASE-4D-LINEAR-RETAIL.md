# 37 — Phase 4D: Curated Linear & Retail Foundation

Status: **Step 1/3 implemented locally; not pushed.**

## Goal

Turn Qraft's first barcode proof into a useful curated 1D/retail catalog without treating
"BWIP can render it" as the product contract.

Phase 4D adds eight curated formats:

- Code 39,
- Code 93,
- Interleaved 2 of 5 (ITF),
- ITF-14,
- EAN-13,
- EAN-8,
- UPC-A,
- UPC-E0.

Code 128 and Data Matrix remain unchanged and Live.

## Standards boundary

### Code 39 / Code 93

The curated path accepts the common base set only:

- `0-9`,
- `A-Z`,
- space,
- `- . $ / + %`.

Qraft does not silently uppercase input. Extended ASCII, shift sequences and reserved
start/stop handling stay outside the curated surface until Expert Mode has explicit syntax.

Operational length ceilings are Qraft product safeguards, not claims about the standards.

### Interleaved 2 of 5

BWIPP may silently prefix an odd-length ITF input with `0` because the symbology encodes digit
pairs. Qraft rejects odd digit counts instead. The encoded value must never differ from the value
Qraft says it encoded unless Qraft explicitly models that transformation.

### Retail GTIN formats

EAN-13, EAN-8, UPC-A and ITF-14 accept either:

- data digits without a check digit, or
- the complete identifier including its check digit.

Qraft owns GS1 Mod-10 calculation and validation before the renderer boundary. When the short
form is supplied, Qraft computes the check digit and sends the canonical complete identifier to
BWIP. When the full form is supplied, Qraft rejects an incorrect check digit before BWIP runs.

UPC-E is deliberately narrower: the curated flow supports standards-defined UPC-E0 only in its
7/8-digit compressed form. UPC-E1 and UPC-A-to-UPC-E conversion stay out of the curated surface
because they introduce non-standard or hidden transformation semantics.

## Canonical payload contract

`ValidatedBarcodePayload` now distinguishes:

- `payload` — accepted user-facing input,
- `encodedPayload` — the exact value handed to the renderer and expected from independent decode,
- `binaryText` — the explicit eight-bit BWIP input,
- optional check-digit metadata.

This distinction prevents a false self-test failure when a valid short GTIN input causes a check
digit to be added. The application render use case returns the canonical encoded payload for
self-test/export state.

Portable barcode projects save the canonical value after successful generation, so reopening a
project never depends on an implicit future engine transformation.

## Capability-driven Studio

The Barcode Studio still lists live formats from `SymbologyRegistry`. Input presentation now comes
from Qraft-owned `BarcodeInputPolicy` metadata rather than a Code128/DataMatrix ternary.

Each format can declare:

- text or numeric mobile input mode,
- row count,
- placeholder,
- standards-aware hint.

Retail formats surface the computed/verified check digit and canonical encoded value inline.

## BWIP boundary

Only `src/engines/render/bwip/bwip-browser-runtime.ts` imports `@bwip-js/browser`.

The runtime adds named imports only for the curated set. Qraft maps its stable `itf` ID to BWIP's
`interleaved2of5` encoder inside the adapter boundary.

EAN/UPC profiles preserve the encoder's native text layout instead of forcing Qraft's generic
centered HRT positioning. When HRT is enabled, BWIP whitespace guard marks are enabled too; turning
HRT off removes those visible marks while Qraft keeps an additional clear-area pad around the symbol.

## Independent decode

The ZXing artifact decoder now maps:

- Code 39 → `CODE_39`,
- Code 93 → `CODE_93`,
- ITF / ITF-14 → `ITF`,
- EAN-13 → `EAN_13`,
- EAN-8 → `EAN_8`,
- UPC-A → `UPC_A`,
- UPC-E → `UPC_E`.

Representative E2E coverage exercises Code 39, strict ITF validation and an EAN-13 computed check
digit through render → independent decode → portable-project export.

## Explicit deferrals

This step does **not** add:

- GS1-128 / FNC workflows,
- EAN/UPC 2- or 5-digit add-ons,
- Code 39 Extended / Code 93 Extended,
- UPC-E1,
- ISBN/ISSN/ISMN helpers,
- DataBar,
- PDF417/Aztec,
- generic Expert Catalog,
- physical-unit print controls.

Those require distinct domain metadata or later Phase 4/6 work; hiding them behind raw BWIP
options would violate Qraft's product contract.

## Research anchors

Implementation was checked against current BWIPP/bwip-js and GS1 material in September 2026:

- BWIPP Code 39 / Code 93 data-set documentation,
- BWIPP Interleaved 2 of 5 behavior for odd-length input,
- BWIPP EAN-13, UPC-A, UPC-E and ITF-14 check-digit input semantics,
- GS1 GTIN check-digit requirements,
- bwip-js 4.11.4 named encoder / SVG API,
- ZXing supported barcode formats.

## Next

Phase 4E (step 2/3) should complete the curated 2D breadth and catalog metadata foundation —
PDF417/Aztec plus the first searchable catalog grouping/search contract — without prematurely
exposing the 100+ renderer catalog.
