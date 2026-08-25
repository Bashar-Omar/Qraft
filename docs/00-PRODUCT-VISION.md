# 00 — Product Vision

## Product statement

**Qraft is a zero-login, privacy-first QR and barcode studio for people who care about both design and technical correctness.**

It should make a first-time user productive in seconds while still giving advanced users standards, print controls, batch workflows and diagnostics usually found only in industrial tools.

## Why Qraft can stand out

“Generate a QR” is commoditized. Qraft's value comes from the system around it:

- **breadth without chaos** — common formats curated, uncommon ones in Expert Mode,
- **beautiful without fragile** — styling paired with scan-risk feedback,
- **power without account friction** — serious tooling stays local,
- **privacy as architecture** — no upload pipeline needed for normal operation,
- **print as first-class** — size, vector output, quiet zones, labels,
- **inspect as well as generate** — decode and explain codes,
- **repeatability without a DB** — portable `.qraft.json` projects and local presets.

## Primary users

### Fast creator

Needs URL, Wi‑Fi, WhatsApp, contact, menu, event or social QR quickly.

### Designer / marketer

Needs logo, custom eyes/modules, gradient, frame, transparent SVG and print-quality files.

### Print / packaging operator

Needs exact physical dimensions, vector output, EAN/UPC/Code 128/Data Matrix, quiet zones and batches.

### Developer / technical user

Needs raw content, GS1/Digital Link, many symbologies, inspectable config and SVG source.

### Scanner / troubleshooter

Needs camera/upload decoding and a readable payload inspector.

## Positioning

Do not lead with “another free QR generator.”

Recommended core message:

> **Craft codes that work.**

Supporting lines:

- “A private QR & barcode studio.”
- “Design, validate, export.”
- “From branded QR to production barcodes.”

## Product principles

1. **Instant first result** — render a safe sample immediately.
2. **Progressive disclosure** — URL users do not see GS1/industrial complexity.
3. **Standards before decoration** — warn on contrast/quiet-zone/logo risks.
4. **Local by default** — no account/cloud history required.
5. **Portable work** — versioned `.qraft.json`.
6. **Expert power is discoverable** — searchable catalog.
7. **Honest capability labels** — no fake “dynamic QR” without backend.

## Core surfaces

1. **Generate**
2. **Scan**
3. **Batch**
4. **Guides**
5. **Privacy/About**

No dashboard/history-centric information architecture.

## v1 success criteria

- common QR payloads work after app load without a server request,
- common QR/barcodes render client-side,
- SVG/PNG/JPEG/WebP/PDF exports are verified,
- mobile generation is first-class,
- desktop preview remains visible while editing,
- keyboard users can generate/export,
- scanner has reliable fallback,
- batch doesn't freeze normal UI,
- public repo contains CI/tests/architecture docs.

## Explicit non-goals

- accounts/billing,
- cloud asset library,
- first-party short links,
- dynamic redirects,
- scan analytics/tracking,
- team collaboration.

## Future extension seams

Possible later adapters:

- user-owned redirect provider,
- optional Qraft Cloud,
- cloud sync/team templates,
- CLI/NPM package using core domain,
- PWA/browser extension,
- design-tool integrations.

They are extension points, not v1 dependencies.
