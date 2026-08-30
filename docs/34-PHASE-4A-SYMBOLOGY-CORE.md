# 34 — Phase 4A: Symbology Core

Status: **Step 1/3 implemented locally; Phase 4B is next.**

## Goal

Open Qraft's architecture from QR-only rendering to barcode breadth **without** weakening the
working QR studio or leaking a barcode vendor API into core/application/UI code.

The Phase 4 roadmap requires a BWIP-backed curated/expert catalog, but engine installation is not
the first move. The existing Phase 3C code correctly modeled a QR-only product and therefore had
QR-specific assumptions in `RenderedCode`, metadata, project files and raster export. Phase 4A
removes the assumptions that would distort or couple future barcode work while preserving the QR
behavior users already have.

## Delivered

### 1. Qraft-owned symbology model

`src/core/code/symbology.ts` now owns:

- stable Qraft IDs,
- family,
- Curated / Expert / Experimental tier,
- Live / Planned availability,
- centralized render capabilities.

The architecture-proof catalog contains:

- QR — live,
- Code 128 — planned for Phase 4B,
- Data Matrix — planned for Phase 4B.

Only QR is reported as live. Library support alone never changes product availability.

### 2. Registry seams instead of switches

`SymbologyRegistry` provides the catalog source of truth and rejects duplicate IDs.

`RendererRegistry` routes a `RenderRequest` to the first installed adapter that advertises support.
It fails with Qraft's typed `CodeRenderError` when no adapter exists. No UI or payload codec needs
a vendor import or central symbology switch.

### 3. Discriminated render contracts

The old render contract assumed every artifact had:

- QR ECC,
- QR version,
- quiet-zone modules,
- a verification matrix.

Phase 4A splits that into:

- `QrRenderRequest` / `RenderedQrCode`,
- barcode render request/metadata contracts,
- the shared `RenderedCode` union.

QR-only systems such as Quality Assistant and independent QR self-test now explicitly consume the
QR subtype. Generic export accepts the broader artifact union.

### 4. Natural SVG geometry

All rendered artifacts expose natural `width` and `height` alongside canonical SVG.

`parseSvgViewBoxDimensions()` reads zero-origin SVG geometry without injecting markup into the DOM.
The designer QR adapter now reports its actual canonical SVG dimensions rather than conflating them
with its 29/33/etc. QR verification grid.

This seam is intentionally reusable by the BWIP adapter because BWIP `toSVG()` returns a canonical
zero-origin `viewBox` and linear/stacked symbols are commonly rectangular.

### 5. Rectangular raster/export foundation

Raster export now resolves `{ width, height }` instead of forcing a square canvas.

Compatibility guarantees:

- current QR targets keep the exact historic integer pixels-per-module calculation,
- future rectangular artifacts preserve aspect ratio,
- when the natural artifact fits the selected target, scaling prefers an integer multiple,
- PNG/JPEG/WebP artifact metadata reports real width and height,
- SVG export reports canonical natural dimensions.

The existing `resolveRasterPixelSize()` remains as a QR-only compatibility helper until Phase 4C
moves the Visual Studio presentation to width/height-aware output metadata.

## Portable project decision

`.qraft.json` remains **schema v1** in this step.

Reason: v1 semantically stores QR ECC/design/logo state and QR is still the only saveable
symbology. Bumping the schema before barcode project state exists would create migration churn with
no user benefit.

When Phase 4C first makes barcode projects saveable:

1. introduce schema v2,
2. define Qraft-owned barcode code settings,
3. add an explicit v1 → v2 migration,
4. keep v1 import compatibility,
5. never reinterpret a v1 QR document as a different symbology.

## Research note for Phase 4B

Current BWIP documentation reports that browser/SVG rendering supports 100+ barcode types. Its SVG
path returns a fully-qualified SVG with a natural `viewBox`. BWIP scale values act as module-width
requests, while `width`/`height` sizing grows in discrete quantums rather than arbitrary stretching.
That behavior is why Qraft establishes rectangular natural geometry before adapter integration.

The adapter will still own all BWIP-specific names/options. Core only sees Qraft IDs and contracts.

## Tests added/expanded

- symbology registry live/planned/capability behavior,
- duplicate registration protection,
- renderer routing and unsupported failure,
- SVG square/rectangular viewBox parsing,
- rectangular raster aspect-ratio/integer scaling,
- QR raster-size regression expectations remain unchanged.

## Deferred to Phase 4B

- add `@bwip-js/browser`,
- map Qraft `code128` and `datamatrix` IDs inside the adapter,
- validate/sanitize canonical vendor SVG,
- add representative encoder vectors and artifact geometry tests,
- keep the barcode package out of the initial QR path via adapter/lazy-loading boundaries.

## Deferred to Phase 4C

- expose barcode selection in Generate,
- capability-driven editor/style/export controls,
- barcode project schema v2,
- desktop/mobile barcode E2E,
- user-facing rectangular export metadata.
