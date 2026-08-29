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

## Phase 2B Quality Assistant refresh — 2026-08-26

### Regular QR quiet zone and ECC — DENSO WAVE

- `https://www.qrcode.com/en/howto/code.html/index.html`
- `https://www.qrcode.com/en/about/error_correction.html`

Re-checked implementation facts:

- regular QR needs a clear four-module margin on all sides,
- four ECC levels L/M/Q/H are available,
- increasing ECC improves restoration headroom but also increases symbol size/density pressure,
- Level M is the common/default baseline described by DENSO.

Qraft treats these as QR-specific facts, not decoration preferences.

### Relative luminance / contrast math — W3C WCAG 2.2 references

- `https://www.w3.org/WAI/WCAG22/Techniques/general/G18`
- `https://www.w3.org/WAI/WCAG22/Techniques/general/G17`

Qraft reuses the documented sRGB relative-luminance conversion (`0.04045` cutoff) and `(L1 + 0.05) / (L2 + 0.05)` ratio because the math is deterministic and explainable.

Important product boundary:

- WCAG contrast ratios are accessibility criteria for content/text, **not QR scan-compliance thresholds**,
- Phase 2B's Strong / Moderate / Low cutoffs are explicitly Qraft heuristics,
- gradient QR foregrounds are sampled at multiple positions rather than judged by a single endpoint.

### `@zxing/library`

- `https://www.npmjs.com/package/@zxing/library`
- `https://github.com/zxing-js/library`

Implementation snapshot re-checked on 2026-08-26:

- current npm release: `0.23.0`,
- Apache-2.0,
- built-in TypeScript declarations,
- one runtime dependency,
- QR decode primitives include `RGBLuminanceSource`, `HybridBinarizer`, `BinaryBitmap` and `QRCodeReader`,
- upstream labels the project maintenance-mode only.

Qraft uses it only behind a lazy browser adapter for explicit self-tests. Vendor types do not cross the engine boundary. The maintenance status is a reason to preserve the replacement seam, not to hide the risk.

`@zxing/browser` remains the later scanner/camera helper candidate; Phase 2B does not need its media/session layer.

## Phase 2C local logo refresh — 2026-08-26

### Qraft blueprint security boundary

The project blueprint requires allow-listed image types, file-size/dimension limits, local decoding and object-URL cleanup. It also warns that uploaded SVG may contain scripts, event handlers or external resources. Phase 2C therefore ships raster-only input and defers raw SVG support until Qraft has a dedicated safe rasterization/sanitization contract.

### `qr-code-styling` image behavior

- `https://github.com/kozakdenys/qr-code-styling`
- `https://github.com/kozakdenys/qr-code-styling/blob/master/src/types/index.ts`
- `https://github.com/kozakdenys/qr-code-styling/issues/144`

Re-checked facts:

- current image options include `hideBackgroundDots`, `imageSize`, `margin` and `saveAsBlob`,
- upstream documents `imageSize` as a coefficient and recommends not using values above 0.5 casually,
- current renderer source derives hidden-dot budget from `imageSize × ECC recovery fraction`,
- `saveAsBlob` exists so SVG output can embed image data instead of leaving a URL reference,
- the long-standing rectangular-logo issue #144 remains open and reports aspect-ratio distortion when image sizing is used.

Qraft therefore stores a portable logo-area percentage, performs the ECC-relative translation only inside the adapter and normalizes source art to a square transparent PNG before renderer hand-off.

### Object URLs — MDN

- `https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static`
- `https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static`

Every object URL retains a reference to its backing object until released. Phase 2C revokes logo URLs on replacement, removal and component unmount.

### Browser file type / image verification — MDN + OWASP

- `https://developer.mozilla.org/en-US/docs/Web/API/Blob/type`
- `https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept`
- `https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap`
- `https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html`

Implementation implications:

- `accept` is only a chooser hint,
- `Blob.type` is not bytestream inspection,
- Qraft checks PNG/JPEG/WebP signatures and dimensions itself before browser decode,
- the browser must successfully decode the bounded image,
- Qraft re-encodes the decoded pixels before renderer use.

## Phase 2D export/project refresh — 2026-08-29

### HTML Canvas raster export — MDN

- `https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob`
- `https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL`

Re-checked facts:

- `toBlob()` accepts an optional output MIME type and quality for lossy encoders,
- PNG is required by the platform,
- browsers may support JPEG/WebP additionally,
- when a requested format is unsupported, the platform may return PNG instead,
- `toDataURL()` builds a large in-memory string and MDN recommends `toBlob()` for larger images.

Qraft therefore uses Blob export and validates the actual returned MIME before assigning a JPEG/WebP filename.

### Blob object URL lifecycle — MDN

- `https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static`

Object URLs retain backing Blob references until released. Project-imported logo URLs reuse Phase 2C's replacement/removal/unmount cleanup discipline.

### Qraft blueprint — portable project security

The project blueprint explicitly identifies large files, malicious object shapes, unknown schema versions and giant data URIs as `.qraft.json` threats. Phase 2D implements file/embedded-asset caps, fresh-object parsing, no unsafe deep merge and migration/version checks before imported state reaches the studio.

## Phase 3A payload refresh — 2026-08-29

### vCard

- `https://www.rfc-editor.org/rfc/rfc6350.html`

RFC 6350 is the IETF vCard Format Specification and obsoletes the older RFC 2426 vCard format. Phase 3A uses vCard 4.0 with CRLF content lines, escaped text and UTF-8-safe folding.

### WhatsApp Click to Chat

- `https://faq.whatsapp.com/5913398998672934/`

WhatsApp documents `https://wa.me/<number>` with the full international number written without formatting characters, and `?text=<urlencodedtext>` for an optional pre-filled message. Qraft accepts a readable `+` international number in the editor, normalizes it locally and emits the documented digits-only path.

### Geographic URI

- `https://www.rfc-editor.org/rfc/rfc5870.html`

RFC 5870 defines the standards-track `geo:` URI with WGS-84 latitude/longitude, optional altitude and optional uncertainty. Phase 3A uses the provider-neutral URI rather than a vendor map URL.

### iCalendar scoping note

- `https://www.rfc-editor.org/rfc/rfc5545.html`

RFC 5545 requires UID and DTSTAMP in VEVENT and has explicit DATE/DATE-TIME/DTEND semantics. Event is therefore scoped to Phase 3B so Qraft can define deterministic timestamp/UID/time-zone behavior instead of emitting a superficially valid but semantically unstable string.

## Phase 3B Event refresh — 2026-08-29

### iCalendar / VEVENT — RFC 5545

- `https://www.rfc-editor.org/rfc/rfc5545.html`
- `https://datatracker.ietf.org/doc/html/rfc5545`

Implementation facts re-checked for Step 1:

- `VCALENDAR` requires `PRODID` and `VERSION`,
- `VEVENT` requires `UID` and `DTSTAMP`; `DTSTART` is required when no `METHOD` is present,
- DTSTAMP is a UTC DATE-TIME,
- all-day events use `VALUE=DATE`, and VEVENT `DTEND` is non-inclusive,
- DATE-TIME with a `Z` suffix is UTC, while a DATE-TIME with neither `Z` nor `TZID` is floating time,
- a named `TZID` reference requires a matching `VTIMEZONE` component in the iCalendar object,
- content lines use CRLF and SHOULD be folded to at most 75 octets without splitting UTF-8 sequences.

Qraft therefore supports all-day, UTC and floating Event modes in this slice, but intentionally defers named-zone output until a complete VTIMEZONE strategy is implemented and tested.

## Phase 3B Raw refresh — 2026-08-29

### UTF-8 byte measurement — WHATWG Encoding / MDN

- `https://encoding.spec.whatwg.org/#interface-textencoder`
- `https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder`
- `https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encode`

Implementation facts re-checked for Step 2:

- `TextEncoder` encodes JavaScript strings as UTF-8,
- `encode()` returns a `Uint8Array`,
- byte length must therefore be measured from encoded bytes rather than JavaScript string length.

Qraft uses this only for local metrics/validation; Raw content is never sent to an external service.

### QR Version 40 binary capacity — DENSO WAVE

- `https://www.qrcode.com/en/about/version.html`

DENSO WAVE's version table documents Version 40 binary capacities of 2953 / 2331 / 1663 / 1273 bytes for ECC L / M / Q / H respectively.

Qraft's current QR adapters intentionally force byte mode, so these values are used as current renderer-capacity policy. The UI calls them byte pressure/ceiling guidance rather than a universal QR or scanner guarantee.

## Phase 3B integration/inspector refresh — 2026-08-29

### URI generic syntax — RFC 3986

- `https://www.rfc-editor.org/rfc/rfc3986.html`

RFC 3986 defines the generic `scheme:` structure but leaves scheme-specific semantics to each registered scheme. Qraft's richer inspector therefore does not treat every colon-containing string as actionable. It first asks the registered structured codecs with explicit signatures, and its generic URL path only auto-detects explicit HTTP(S) payloads.

### Async Clipboard — MDN

- `https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText`

`Clipboard.writeText()` is a user-initiated browser API and may be unavailable when secure-context/browser permission requirements are not met. The inspector therefore treats Copy as optional convenience: generation/inspection never depends on clipboard access and a failed copy is presented as a local UI status rather than a fatal workflow error.

### Qraft blueprint — inspector boundary

The blueprint requires raw + parsed inspection, explicit safe actions and no automatic URL opening. Step 3 establishes the reusable parser/presentation seam in Generate now; camera/image decoding and create-from-scan remain Phase 5 responsibilities.
