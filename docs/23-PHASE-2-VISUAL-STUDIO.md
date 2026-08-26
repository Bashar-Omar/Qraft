# Phase 2 — Visual Studio

## Status

Phase 2A starts the visual QR system after the Phase 1 Core QR gate.

This slice delivers:

- a Qraft-owned QR design schema,
- validated solid/linear-gradient foreground paint,
- solid/transparent background paint,
- module styles,
- eye-frame and eye-dot styles,
- curated presets as data,
- a browser-only `qr-code-styling` adapter,
- canonical styled SVG preview/export,
- PNG rasterization from the canonical SVG,
- preservation of the four-module quiet-zone baseline,
- browser E2E coverage for styled SVG + PNG export.

Logo placement and Quality Assistant findings are intentionally deferred to the next Phase 2 slice so styling is not allowed to outrun scan-risk feedback.

## Architecture

```text
payload codec
→ GenerateCode
→ QraftQrDesign validation
→ QrRenderer
   ├─ default design → StandardQrRenderer → canonical baseline SVG
   └─ styled design  → DesignerQrRenderer
                      ├─ StandardQrRenderer → verification matrix + QR metadata
                      └─ lazy qr-code-styling → canonical styled SVG
→ preview / SVG exporter / PNG rasterizer
```

The design schema is owned by `src/core/design/`. Vendor option names do not leave `src/engines/render/designer-qr/`.

`RenderedCode.verificationMatrix` is deliberately named as a verification reference rather than the preview artifact. Styled renderers may choose a different valid QR mask from the standards baseline. The user-visible and downloadable artifact is `RenderedCode.svg`.

## Why the designer package is lazy and browser-only

`qr-code-styling` is a browser-oriented package and historically has had `window`/`self` problems when eagerly imported in Next.js server execution. Qraft therefore does not import its runtime at module load. `QrRenderer` keeps the untouched Pure Mono design on the lightweight standard engine; only a design that actually needs visual styling reaches `DesignerQrRenderer`, which checks for a browser environment before dynamically importing the package.

This preserves static generation, avoids paying the designer-engine runtime cost for the initial standard QR, and prevents the package from leaking into server/landing execution.

## Canonical export change

Phase 1 PNG export painted the normalized matrix directly to Canvas. That was correct for black-square QR, but it would discard gradients and module/eye styling.

Phase 2A changes raster export to:

```text
canonical generated SVG
→ browser image decoder
→ Canvas at an integer pixels-per-module size
→ PNG Blob
```

SVG export continues to write the canonical generated SVG directly.

## Design boundaries

Current design model:

- foreground: solid or two-stop linear gradient,
- background: solid or transparent,
- module shape,
- eye frame shape,
- eye dot shape,
- quiet zone in modules.

Input colors are restricted to normalized six-digit hex values. Gradient rotation is stored in degrees in the Qraft model and translated to radians only inside the vendor adapter.

The quiet zone remains at least four modules; the current UI keeps it locked at four.

## Presets

Phase 2A ships:

1. Pure Mono,
2. Qraft Mint,
3. Soft Mint,
4. Packaging.

Presets are Qraft design data, not view conditionals and not saved vendor objects.

Riskier inverted/dark presets wait for Quality Assistant feedback rather than shipping without warnings.

## Testing

Automated coverage adds:

- design schema normalization and rejection cases,
- preset schema coverage,
- Qraft→vendor option mapping,
- renderer routing that keeps the default design on the lightweight standard engine,
- explicit non-browser adapter failure,
- Playwright designer interaction,
- styled SVG download,
- styled PNG rasterization/download.

The standard QR renderer and existing render/decode golden vectors remain the conservative structural oracle.

## Next Phase 2 slice

1. Quality Assistant foundation,
2. contrast/inversion/quiet-zone findings,
3. local styled-artifact self-decode,
4. local logo upload with size/padding limits,
5. logo occlusion guidance,
6. JPEG/WebP,
7. `.qraft.json` project schema after the design model stabilizes.
