# 14 — Implementation Backlog

This can be converted directly into GitHub Issues/Epics.

## Epic A — Bootstrap

### A1 Scaffold

Acceptance:

- App Router,
- `src/`,
- TS strict,
- Tailwind,
- pnpm,
- build succeeds.

### A2 Design tokens

- reference palette in CSS variables,
- semantic light/dark,
- no repeated hard-coded mint.

### A3 Brand

- pristine SVG source,
- semantic logo variants,
- favicon/app icon derived separately.

### A4 CI

- lint/typecheck/test/build on PR/main.

## Epic B — Domain foundation

- B1 `PayloadCodec`
- B2 payload registry
- B3 symbology registry
- B4 renderer port
- B5 exporter port
- B6 decoder port
- B7 quality-rule port

Acceptance:

- no vendor imports in core/UI.

## Epic C — Common payloads

Implement + test:

- URL,
- text,
- email,
- phone,
- SMS,
- Wi‑Fi.

Each includes:

- schema,
- codec,
- sample,
- editor,
- tests,
- inspector.

## Epic D — Generate UI

- D1 responsive studio shell
- D2 type picker
- D3 editor infrastructure
- D4 preview
- D5 quality panel
- D6 quick export
- D7 mobile bottom action

Acceptance:

- usable 320px → large desktop,
- keyboard flow complete.

## Epic E — Designer QR

- adapter
- colors
- gradients
- modules
- eyes
- logo
- presets
- quality warnings

Acceptance:

- library-specific types remain in adapter.

## Epic F — Export

- SVG
- PNG
- JPEG
- WebP
- PDF
- filename sanitizer
- physical size helpers

Acceptance:

- artifact-level automated tests.

## Epic G — Project files

- schema v1
- export
- import
- migration infrastructure
- embedded asset controls

Acceptance:

- malformed/newer/unsafe project files fail gracefully.

## Epic H — Barcode engine

- bwip adapter
- catalog metadata
- Code 128
- EAN/UPC
- Code 39/93
- ITF/ITF-14
- Data Matrix
- Aztec
- PDF417
- QR variants
- Expert Catalog

Acceptance:

- no giant format dropdown,
- engine lazy loads.

## Epic I — Scanner

- camera abstraction
- native decoder
- ZXing decoder
- composite fallback
- upload
- inspector
- create-from-result
- self-test

Acceptance:

- URLs do not auto-open,
- camera stops correctly.

## Epic J — Quality

- quiet zone
- contrast
- gradient sampling
- logo occlusion
- ECC suggestion
- density
- self-decode
- finding UX

Acceptance:

- heuristic labels are honest.

## Epic K — Batch

- CSV parse
- mapper
- validation table
- typed worker protocol
- bounded runner
- ZIP
- manifest
- progress/cancel
- error export

## Epic L — Print

- physical units
- page preview
- A4/Letter
- PDF layout
- print-safe preset
- label grid

## Epic M — Product polish

- command palette,
- shortcuts,
- undo/redo,
- empty/error states,
- loading,
- dark mode,
- toast,
- reduced motion,
- transition polish.

## Epic N — Public release

- README visuals,
- architecture diagram,
- privacy page,
- guides,
- contribution/security,
- license decision,
- Vercel domain,
- GitHub release.

## First 12 coding issues

1. `chore: scaffold Qraft foundation`
2. `feat: implement design tokens and themes`
3. `feat: add payload registry and codec contracts`
4. `feat: add renderer and exporter ports`
5. `feat: implement URL and text codecs`
6. `feat: implement safe standard QR renderer`
7. `feat: build responsive Generate studio shell`
8. `feat: add SVG and PNG export`
9. `test: add QR render-decode golden vectors`
10. `feat: implement Wi-Fi payload`
11. `feat: add designer QR adapter`
12. `feat: add quality assistant foundation`

## Definition of Done

A feature is not done until:

- typed,
- validated,
- happy/error states designed,
- keyboard usable,
- mobile usable,
- tests exist,
- docs updated for non-obvious behavior,
- no production console errors,
- no unnecessary dependency.
