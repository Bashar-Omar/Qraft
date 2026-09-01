# 35 — Phase 4B: Isolated BWIP Barcode Adapter

Status: **Step 2/3 implemented locally; Phase 4C UX integration is next.**

## Goal

Prove Qraft's first standards/barcode rendering engine without turning BWIP into product architecture.

Phase 4A established generic symbology, renderer and rectangular-artifact contracts. Phase 4B now
adds a real browser barcode engine behind those contracts for a deliberately small representative
slice:

- Code 128 — linear family proof,
- Data Matrix ECC 200 — matrix family proof.

They remain **Planned**, not Live, until Phase 4C exposes capability-driven UI, project persistence
and browser E2E. Engine support alone is not a product-support claim.

## Dependency decision

Qraft pins `@bwip-js/browser` `4.11.4`.

Reasons:

- MIT licensed,
- browser/SVG capable,
- zero package dependencies,
- current package exposes named barcode encoders,
- named encoders allow the bundler to tree-shake the initial slice instead of treating the generic
  100+ encoder catalog as one eager dependency.

The package is only imported by:

`src/engines/render/bwip/bwip-browser-runtime.ts`

`LazyBwipBarcodeRenderer` dynamically imports the concrete renderer only after a Code 128 or Data
Matrix render request. Existing QR generation therefore has no eager BWIP import path.

## Anti-corruption boundary

The implementation is split into:

1. `core/code/barcode-input.ts` — Qraft-owned input semantics and safety bounds,
2. `bwip-contract.ts` — the minimal vendor-local option/runtime contract Qraft allows,
3. `bwip-barcode-adapter.ts` — registry/profile-based Qraft symbology → engine-option mapping,
4. `bwip-svg.ts` — canonical SVG validation and geometry extraction,
5. `bwip-browser-runtime.ts` — the only concrete `@bwip-js/browser` API binding and named-encoder registry,
6. `lazy-bwip-barcode-renderer.ts` — browser chunk boundary.

Both core validation and adapter mapping are registry/profile driven. Adding another curated barcode does
not require extending a central format switch through multiple layers.

No payload codec, application component or React file imports BWIP.

## Curated Code 128 contract

Phase 4B intentionally supports **visible ASCII (`0x20`–`0x7E`) only**, preserving the exact input
without trimming.

This is narrower than the full Code 128 standard on purpose. It avoids pretending Qraft already has
first-class controls for:

- FNC1/FNC2/FNC3/FNC4,
- GS1-128 application identifiers,
- control characters,
- extended-byte workflows.

Those belong in later curated/Expert workflows with dedicated validation and vectors.

Qraft applies an operational 128-character ceiling to prevent pathological browser artifacts. This
is a Qraft safety boundary, **not** a claim that Code 128 has a universal 128-character standards
limit.

Rendering policy for the current proof:

- `scale: 1` for deterministic one-pixel module geometry,
- 15 mm requested bar height,
- human-readable text on by default but explicitly suppressible,
- 10-module left/right clear area,
- solid white background.

## Curated Data Matrix byte semantics

Phase 4B accepts ISO-8859-1 / Latin-1 code points only (`U+0000`–`U+00FF`) and converts them to an
explicit eight-bit string before calling BWIP with `binarytext: true`.

This is a correctness boundary. BWIP otherwise UTF-8 encodes JavaScript strings, while generic Data
Matrix readers do not magically know that arbitrary byte sequences should be interpreted as UTF-8.
Unicode outside Latin-1 therefore remains rejected until Qraft implements and tests an explicit ECI
workflow.

Current boundary:

- maximum 1555 Latin-1 bytes,
- one-module clear area on all sides,
- no human-readable text control,
- solid white background.

## Canonical SVG trust boundary

BWIP's SVG drawing backend currently emits a narrow structure built from:

- `svg`,
- `path`,
- `rect`,
- `defs`,
- `clipPath`,
- local `url(#id)` clip references.

Qraft does not inject vendor output blindly. `validateBwipSvg()`:

- caps artifact size,
- requires a normal zero-origin canonical SVG root,
- allow-lists the expected tags,
- rejects event handlers, `href`/`xlink:href`, inline `style`, XML/DOCTYPE/CDATA and unknown tags,
- rejects non-local `url(...)` references,
- extracts natural width/height through the Phase 4A SVG geometry parser.

The accepted SVG becomes the canonical preview/export artifact.

## Application integration

`createRenderBarcode()` is the non-React application seam for Phase 4B.

It:

1. resolves Qraft symbology metadata,
2. validates Qraft input semantics before the engine,
3. derives human-readable-text defaults from capabilities,
4. rejects capability-incompatible options,
5. dispatches to the barcode renderer registry.

The composition exports `renderBarcode`, but the Generate UI does **not** call it yet. Phase 4C owns
that release boundary.

## Error model

Known failures stay typed as Qraft errors:

- invalid product input → `invalid-request`,
- curated/product capacity boundary → `capacity`,
- unsupported symbology → `unsupported`,
- malformed/unsafe vendor output or unknown engine failure → `engine`.

Raw vendor errors are not surfaced as product contracts.

## Tests added

- Code 128 exact-input/ASCII/operational-capacity validation,
- Data Matrix Latin-1 byte semantics, ECI-required rejection and byte ceiling,
- safe/unsafe BWIP SVG boundary cases,
- deterministic Code 128 option mapping and HRT on/off behavior,
- deterministic Data Matrix option mapping and Latin-1 byte preservation,
- clear-area metadata,
- vendor capacity/error mapping,
- application capability defaults and pre-render validation,
- lazy renderer support surface,
- architecture test proving only the runtime binding imports `@bwip-js/browser`.

A real independent barcode decode round-trip remains a Phase 4C/5 browser gate where Qraft can test
the final rendered artifact through a multi-format decoder. Phase 4B does not label engine contract
tests as scanner certification.

## Research references

- https://www.npmjs.com/package/@bwip-js/browser
- https://github.com/metafloor/bwip-js — named encoders, `drawingSVG()`, `binarytext` and scaling semantics
- https://github.com/bwipp/postscriptbarcode/wiki/Code-128 — Code 128 data/reader semantics
- https://github.com/bwipp/postscriptbarcode/wiki/Data-Matrix — Data Matrix ECC 200 data, ECI and sizing semantics
- https://github.com/metafloor/bwip-js/wiki/BWIPP-border-vs-bwipjs-padding
- https://www.iso.org/standard/43896.html — Code 128 / ISO/IEC 15417
- https://www.iso.org/standard/80926.html — Data Matrix / ISO/IEC 16022

## Phase 4C next

- expose barcode selection in Generate without flattening payload intent and symbology,
- make editor/style/quality/export controls derive from capabilities,
- add real Code 128/Data Matrix preview/export UX,
- introduce `.qraft.json` schema v2 + explicit v1 migration when barcode projects become saveable,
- add browser E2E and independent artifact decode checks,
- only then change the relevant symbologies from Planned to Live.
