# 19 — Research Sources

Research snapshot: **2026-08-25**.

Versions change. Re-verify before implementation.

## Framework / deployment

### Next.js

`https://nextjs.org/docs/`

Observed:

- App Router,
- static export guidance,
- latest docs displayed 16.3.3 at research time.

### Next.js Blog

`https://nextjs.org/blog`

On 2026-08-25, the Next.js blog stated that the August 2026 security release was available and advised upgrading to **16.3.3 (Active LTS)** or **15.5.24 (Maintenance LTS)** to address two Critical-severity vulnerabilities. Re-check the latest patched stable/LTS release when scaffolding.

### Vercel Next.js

`https://vercel.com/solutions/nextjs`

## Rendering/scanning

### bwip-js

`https://www.npmjs.com/package/bwip-js`  
`https://github.com/metafloor/bwip-js`

Snapshot:

- 4.11.4,
- MIT,
- browser/SVG,
- 100+ types/standards.

### qr-code-styling

`https://www.npmjs.com/package/qr-code-styling`  
`https://github.com/kozakdenys/qr-code-styling`

Snapshot:

- 1.9.2,
- MIT,
- styled QR/logo.

### @zxing/browser

`https://www.npmjs.com/package/@zxing/browser`  
`https://github.com/zxing-js/browser`

Snapshot:

- 0.2.1,
- MIT,
- camera/image/video scanning helpers.

## Web APIs

### BarcodeDetector

`https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector`

Basis for native fast path + fallback.

### OffscreenCanvas

`https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas`

Basis for worker/batch optimization.

## QR technical references

DENSO WAVE:

- `https://www.qrcode.com/en/about/error_correction.html`
- `https://www.qrcode.com/en/about/version.html`
- `https://www.qrcode.com/en/howto/code.html`
- `https://www.qrcode.com/en/codes/microqr.html`
- `https://www.qrcode.com/en/codes/rmqr.html`
- `https://www.qrcode.com/en/about/standards.html`

## GS1

`https://www.gs1.org/standards/gs1-digital-link`

Use current GS1 documentation when implementing identifier/URI validation.

## Competitors

### QRCode Monkey

`https://www.qrcode-monkey.com/`

Studied for free static customization/export.

### QR TIGER

`https://www.qrcode-tiger.com/`

Studied for content-type breadth, bulk/dynamic SaaS patterns.

### TEC-IT Barcode Generator

`https://barcode.tec-it.com/en`

Studied for broad symbology taxonomy and industrial options.

### Adobe Express

`https://www.adobe.com/express/feature/image/qr-code-generator`

### Canva

`https://www.canva.com/qr-code-generator/`

Studied for consumer creative polish.

## UI / fonts

### Geist

`https://vercel.com/font`  
`https://github.com/vercel/geist-font`

### Radix

`https://www.radix-ui.com/primitives`

### Motion

`https://motion.dev/`

## Research discipline

Before a standards-specific advanced feature:

1. re-open primary/current documentation,
2. verify installed renderer capability,
3. add golden vectors,
4. use accurate terminology.

This blueprint is not a replacement for ISO/GS1 specifications.

## Phase 1 standard QR engine

### `qr` / paulmillr-qr

- `https://www.npmjs.com/package/qr`
- `https://github.com/paulmillr/qr`
- `https://github.com/paulmillr/qr/releases/tag/0.6.0`
- `https://jsr.io/@paulmillr/qr`

Phase 1A selection notes:

- current reviewed version: `0.6.0`,
- zero runtime dependencies,
- built-in TypeScript declarations,
- raw matrix generation,
- L/M/Q/H error correction,
- decoding support used only as an initial software regression gate,
- designer QR styling remains a separate adapter decision.
