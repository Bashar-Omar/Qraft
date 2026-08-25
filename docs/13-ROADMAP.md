# 13 — Roadmap

Organized by release gates rather than arbitrary dates.

## Phase 0 — Repository foundation

Deliver:

- latest patched stable Next.js scaffold,
- TypeScript strict,
- pnpm,
- lint/format,
- test setup,
- CI,
- design tokens,
- Geist Sans/Mono,
- Qraft logo component,
- app shell/error boundary,
- this documentation pack integrated.

Gate:

- lint/typecheck/test/build pass in CI.

## Phase 1 — Core QR

Deliver:

- payload registry,
- URL/Text/Email/Phone/SMS/Wi‑Fi,
- safe standard QR,
- live preview,
- ECC + safe quiet zone,
- SVG + PNG,
- responsive studio.

Gate:

- desktop/mobile generation works and exported fixtures decode correctly.

## Phase 2 — Visual Studio

Deliver:

- designer QR adapter,
- colors/gradient,
- module/eye styles,
- local logo,
- preset system,
- Quality Assistant v1,
- JPEG/WebP,
- `.qraft.json`.

Gate:

- presets round-trip decode on golden fixtures at reference sizes.

## Phase 3 — Payload breadth

Deliver:

- vCard,
- WhatsApp,
- location,
- event,
- Raw mode,
- app/social helpers,
- richer inspector.

Gate:

- codec tests + physical mobile smoke tests.

## Phase 4 — Barcode breadth

Deliver:

- bwip adapter,
- curated common 1D/2D,
- retail validation,
- Data Matrix/Aztec/PDF417,
- tested Micro QR/rMQR,
- Expert Catalog,
- human-readable text controls.

Gate:

- golden representative suite per family,
- capability-driven controls hide irrelevant styling.

## Phase 5 — Scanner / Inspector

Deliver:

- camera,
- image upload,
- native feature detection,
- ZXing fallback,
- result parser,
- create-from-scan,
- self-test integration.

Gate:

- physical iOS + Android scan verified,
- camera tracks cleanly stop.

## Phase 6 — Export / Print

Deliver:

- PDF,
- physical mm/in sizing,
- DPI helper,
- page preview,
- print-safe preset,
- labels/grid.

Gate:

- PDF/SVG samples verified in browser and professional design/print workflow.

## Phase 7 — Batch Studio

Deliver:

- CSV,
- mapper,
- row validation,
- worker/bounded queue,
- progress/cancel,
- ZIP,
- manifest,
- error report.

Gate:

- chosen normal batch benchmark completes without UI lock.

## Phase 8 — Hardening

Deliver:

- accessibility sweep,
- performance budgets,
- CSP/security headers,
- guides/SEO,
- polished errors,
- dependency/license audit.

## Phase 9 — Public v1

Deliver:

- final README,
- screenshots/demo,
- architecture diagram,
- live Vercel deployment,
- release notes,
- `v1.0.0` tag.

## Portfolio demo path

A reviewer should be able to:

1. open live URL,
2. build a branded QR in under a minute,
3. see quality feedback,
4. export SVG,
5. generate a retail/2D barcode,
6. scan a code,
7. inspect Batch,
8. open GitHub and see clean architecture/tests/docs.

## Post-v1

### v1.1

- local named presets,
- command palette,
- richer GS1 Digital Link,
- scanner device controls,
- label templates.

### v1.2

- PWA/offline,
- expanded Expert docs,
- batch scaling,
- non-sensitive share-config URL.

### Optional v2/service

- BYO redirect provider,
- optional Qraft Cloud redirect,
- opt-in analytics,
- sync/team.

Do not let optional cloud ambitions pollute v1's privacy-first core.
