# 05 — Technology Stack

## Recommended stack

### App

- Next.js App Router
- React
- TypeScript strict
- pnpm
- client-side-first, static-export-friendly

### UI

- Tailwind CSS
- CSS custom properties
- Radix UI primitives
- Lucide icons
- Motion selectively

### Forms/data

- Zod
- React Hook Form

### State

- Zustand, small slices/selectors
- in-memory undo/redo
- optional local persistence only for chosen settings/presets

### Rendering

- `qr-code-styling` — designer QR adapter
- `bwip-js` / `@bwip-js/browser` — broad standards/barcode adapter

### Scanning

- native `BarcodeDetector` when supported
- `@zxing/browser` fallback

### Export

- native renderer SVG
- Canvas/OffscreenCanvas for raster
- jsPDF for PDF shell
- svg2pdf.js only if integration tests confirm a clean vector pipeline
- JSZip for batch ZIP

### Testing

- Vitest
- Testing Library
- Playwright
- axe integration

### Quality

- ESLint
- Prettier
- GitHub Actions
- dependency/security review
- Lighthouse CI after UI stabilizes.

## Why Next.js instead of only Vite?

A Vite SPA can generate codes perfectly well. Next.js is recommended because Qraft is also a portfolio product:

- landing/guides/SEO,
- metadata/OG,
- file-based route architecture,
- excellent Vercel path,
- static export support,
- modern React integration.

Important: do not accidentally create server coupling just because Next can run servers.

## Static export target

Strong initial target:

```ts
const nextConfig = {
  output: "export",
};
export default nextConfig;
```

Validate feature compatibility during scaffold. If future behavior truly needs server runtime, record an ADR.

## Version policy

At research time, the Next.js team had already published its August 2026 security release and advised upgrading to **16.3.3 (Active LTS)** or **15.5.24 (Maintenance LTS)** to address two Critical-severity vulnerabilities.

Therefore:

> install the latest patched stable Active/Maintenance LTS at actual scaffold time, never an older vulnerable patch.

Never treat planning docs as a lockfile.

## Dual renderer

### Designer QR

Responsibilities:

- ordinary QR,
- logo,
- gradient,
- module/eye styles.

Candidate: `qr-code-styling`.

### Standards/barcode

Responsibilities:

- 1D,
- industrial 2D,
- Micro QR/rMQR where supported,
- GS1/specialty,
- SVG/canvas.

Candidate: bwip-js.

### Routing example

```text
URL + Designer QR → StyledQrRenderer
URL + rMQR        → BwipRenderer
EAN-13            → BwipRenderer
```

Engine selection belongs to capability/application logic, not UI conditionals.

## Isolate `qr-code-styling`

Its product fit is strong, but maintenance cadence is slower. Keep:

- adapter boundary,
- Qraft-owned design model,
- renderer contract tests,
- replacement path.

## Why bwip-js

Research snapshot:

- MIT,
- browser support,
- SVG,
- 100+ formats/standards.

Ideal for broad coverage behind a curated UX.

## Scanner contract

```ts
interface Decoder {
  isSupported(): Promise<boolean>;
  decode(input: DecodeInput, options?: DecodeOptions): Promise<DecodeResult[]>;
}
```

Implement:

- `NativeBarcodeDetectorDecoder`
- `ZxingDecoder`
- `CompositeDecoder`

Camera UI must not depend on ZXing classes.

## State slices

```text
studioContent
studioDesign
studioExport
studioQuality
ui
```

Do not globally persist:

- MediaStreams,
- canvas elements,
- huge buffers,
- File objects.

## Schemas

Zod at boundaries:

- form data,
- project JSON,
- CSV mapping,
- external renderer options,
- share-state.

Avoid reparsing already-valid internal objects unnecessarily.

## Dependency budget questions

Before adding a package:

1. Can Web Platform do it?
2. Does an existing dependency do it?
3. Can it lazy-load?
4. License okay?
5. Maintenance/security acceptable?
6. Can it live behind an adapter?

## Browser target

Current evergreen:

- Chromium,
- Firefox,
- Safari,
- iOS Safari.

Feature detection required for:

- BarcodeDetector,
- OffscreenCanvas,
- Clipboard image,
- torch,
- Web Share,
- File System Access.

No core workflow may depend on one non-baseline feature without a fallback.
