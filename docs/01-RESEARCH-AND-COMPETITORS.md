# 01 — Research & Competitor Analysis

Research date: **2026-08-25**.

Observed facts and Qraft recommendations are separated below.

## Competitor archetypes

### QRCode Monkey — free designer/static benchmark

Observed:

- common payload types,
- colors/gradients,
- logo,
- body/eye styles,
- static codes without expiry,
- PNG/SVG/PDF/EPS options,
- simple creation flow.

Qraft lesson:

- visual customization + vector export are baseline expectations.
- Qraft should surpass it with quality diagnostics, scanner, print sizing, batch, portable projects and broad barcode support.

Source: `https://www.qrcode-monkey.com/`

### QR TIGER — SaaS feature-breadth benchmark

Observed:

- many intent/content types,
- branded design,
- bulk/dynamic/analytics-oriented product.

Qraft lesson:

- use the “intent” mental model: users think “Wi‑Fi QR,” not “encode text.”
- dynamic/tracking features belong to a backend boundary, not a fake local toggle.

Source: `https://www.qrcode-tiger.com/`

### TEC-IT Barcode Generator — industrial breadth benchmark

Observed:

- broad linear/2D/GS1/retail/postal/specialty catalog,
- technical sizing and human-readable-text controls.

Qraft lesson:

- use **curated catalog + searchable Expert Mode**.
- 100+ formats in a flat list would be bad UX.
- technical formats need metadata/validation, not just renderer IDs.

Source: `https://barcode.tec-it.com/en`

### Adobe Express / Canva — consumer-polish benchmark

Observed:

- quick creative controls,
- polished preview/export expectations.

Qraft lesson:

- feel like a design tool, but beat general creative suites on standards, diagnostics, repeatability, scan/print depth and privacy.

Sources:

- `https://www.adobe.com/express/feature/image/qr-code-generator`
- `https://www.canva.com/qr-code-generator/`

## Library research

### `bwip-js`

NPM research snapshot:

- version 4.11.4,
- MIT,
- browser + SVG support,
- **100+ barcode types/standards**.

Why it fits:

- one mature standards engine,
- broad 1D/2D support,
- vector output,
- browser execution.

Source: `https://www.npmjs.com/package/bwip-js`

### `qr-code-styling`

Research snapshot:

- version 1.9.2,
- MIT,
- focused on styled QR with logo/custom visual elements.

Why:

- strong match for Designer QR mode.

Risk:

- slower recent release cadence than some dependencies.

Mitigation:

- isolate behind an adapter and maintain a replacement path.

Source: `https://www.npmjs.com/package/qr-code-styling`

### `@zxing/browser`

Research snapshot:

- version 0.2.1,
- MIT,
- camera/image/video browser scanning helpers and multi-format readers.

Use as compatibility fallback and for local self-tests.

Source: `https://www.npmjs.com/package/@zxing/browser`

### Native `BarcodeDetector`

MDN currently treats it as limited/experimental rather than universally baseline.

Strategy:

1. feature detect,
2. native fast path,
3. ZXing fallback,
4. no scanner workflow depends solely on native support.

Source: `https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector`

### OffscreenCanvas

Useful for moving raster/batch work off the main thread in supporting browsers.

Source: `https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas`

## Standards research that affects UX

DENSO QR documentation covers:

- ECC levels L/M/Q/H,
- regular QR versions 1–40,
- four-module quiet zone for normal QR,
- Micro QR family,
- rMQR rectangular variant.

Qraft implications:

- ECC/quiet zone/density belong in Quality, not buried trivia.
- design layer must not silently crop required clear space.
- variant-specific rules are required.

Sources:

- `https://www.qrcode.com/en/about/error_correction.html`
- `https://www.qrcode.com/en/about/version.html`
- `https://www.qrcode.com/en/howto/code.html`
- `https://www.qrcode.com/en/codes/microqr.html`
- `https://www.qrcode.com/en/codes/rmqr.html`

## GS1 direction

GS1 Digital Link is relevant to modern 2D/product workflows.

Qraft should provide a structured advanced editor and clearly state that generating a symbol does **not** allocate or prove ownership of GS1 identifiers.

Source: `https://www.gs1.org/standards/gs1-digital-link`

## Gap map

| Capability               | Simple QR | Paid QR SaaS | Industrial barcode | Qraft target |
| ------------------------ | --------: | -----------: | -----------------: | -----------: |
| Static URL QR            |      High |         High |             Medium |         High |
| Branded QR               |      High |         High |                Low |         High |
| 100+ symbologies         |       Low |      Low/Med |               High |         High |
| Friendly payload editors |    Medium |         High |                Low |         High |
| No account               |     Often |         Rare |              Often |          Yes |
| Explicit client privacy  |    Varies |  Usually low |             Varies |         High |
| Scanner + inspector      |   Low/Med |       Medium |             Medium |         High |
| Quality assistant        |       Low |       Medium |          Technical |         High |
| Physical print sizing    |       Low |      Low/Med |               High |         High |
| Batch without account    |       Low |         Paid |             Medium |         High |
| Portable project file    |      Rare |        Cloud |               Rare |          Yes |
| Premium responsive UI    |    Medium |         High |                Low |         High |
| Open architecture/tests  |      Rare |           No |             Varies |         High |

## Competitive strategy

Qraft's signature combination:

**Design × Standards × Privacy × Engineering quality**

Ideal user journey:

1. choose real-world intent,
2. enter content,
3. craft style,
4. see quality feedback,
5. self-test,
6. export precisely,
7. optionally save a portable project,
8. never create an account.

## What not to copy

- account walls before download,
- fake expiry messaging for static QR,
- bloated dashboard nav,
- huge template carousels hiding the editor,
- uncontrolled decoration without scan warnings,
- 100+ item flat dropdowns,
- unnecessary server uploads,
- generic “AI SaaS” visual language.
