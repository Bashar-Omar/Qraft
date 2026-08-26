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

## Phase 1B payload serialization refresh — 2026-08-26

### Email — RFC 6068

`https://www.rfc-editor.org/rfc/rfc6068.html`

Implementation notes re-checked:

- `mailto:` supports recipient addresses plus header fields,
- `subject` and `body` are the interoperable general-purpose fields,
- reserved/query characters need percent encoding,
- spaces should use `%20`, not `+`,
- body line breaks are encoded as CRLF (`%0D%0A`).

### Phone — RFC 3966

`https://www.rfc-editor.org/rfc/rfc3966.html`

Implementation notes re-checked:

- `tel:` distinguishes global and local numbers,
- global numbers start with `+`,
- visual separators do not change number identity,
- local numbers require a `phone-context`.

Qraft's curated Phase 1 editor therefore requires global form instead of inventing local context.

### SMS — RFC 5724

`https://www.rfc-editor.org/rfc/rfc5724.html`

Implementation notes re-checked:

- `sms:` reuses RFC 3966 telephone-subscriber syntax,
- global form is preferred where available,
- the standardized SMS field defined by the RFC is `body`.

### Wi-Fi QR — ZXing Barcode Contents + parser

- `https://github.com/zxing/zxing/wiki/Barcode-Contents#wi-fi-network-config-android-ios-11`
- `https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/client/result/WifiResultParser.java`

Implementation notes re-checked:

- common payload prefix is `WIFI:`,
- `S` is the required SSID,
- `T` commonly uses `WPA`, `WEP` or `nopass`,
- `P` carries the password for protected networks,
- `H:true` marks a hidden network,
- backslash, semicolon, comma, double quote and colon are escaped with a backslash.

Wi-Fi QR payload syntax is an ecosystem convention rather than an IETF URI standard, so Qraft documents it as compatibility behavior rather than formal certification.

## Phase 2A designer QR refresh — 2026-08-26

### `qr-code-styling`

- `https://www.npmjs.com/package/qr-code-styling`
- `https://github.com/kozakdenys/qr-code-styling`
- `https://github.com/kozakdenys/qr-code-styling/blob/master/src/types/index.ts`
- `https://github.com/kozakdenys/qr-code-styling/blob/master/src/core/QRCodeStyling.ts`
- `https://github.com/kozakdenys/qr-code-styling/issues/38`

Re-checked implementation facts:

- current npm release remains `1.9.2`, MIT, with built-in declarations,
- runtime dependency is `qrcode-generator ^1.4.4`,
- SVG/PNG/JPEG/WebP raw artifacts are supported,
- dots/modules and corner square/dot shapes are configurable,
- gradients accept radians, so Qraft stores degrees and converts only in the adapter,
- `roundSize: false` avoids extra module rounding margin in SVG,
- historical Next.js eager-import failures justify a client-only dynamic import boundary,
- package maintenance cadence is slower than Qraft's core stack, reinforcing ADR-008's replaceable adapter requirement.
