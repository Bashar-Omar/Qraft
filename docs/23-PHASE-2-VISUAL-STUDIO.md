# Phase 2 — Visual Studio

## Status

Phase 2 is being delivered as small gated slices after the Phase 1 Core QR baseline.

- **Phase 2A — Visual Studio foundation: complete**
- **Phase 2B — Quality Assistant foundation: complete**
- **Phase 2C — local logo + occlusion guardrails: current**
- later Phase 2 slices — JPEG/WebP and `.qraft.json`

The full roadmap gate remains: shipped presets must round-trip decode on representative golden/reference artifacts before Phase 2 is considered complete.

## Phase 2A — visual design foundation

Phase 2A delivered:

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

### Rendering architecture

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

`RenderedCode.verificationMatrix` is deliberately a structural reference rather than the preview artifact. Styled renderers may choose a different valid QR mask from the standards baseline. The user-visible and downloadable artifact is `RenderedCode.svg`.

### Why the designer package is lazy and browser-only

`qr-code-styling` is browser-oriented. Qraft does not import its runtime at module load. `QrRenderer` keeps the untouched Pure Mono design on the lightweight standard engine; only a design that needs visual styling reaches `DesignerQrRenderer`, which dynamically imports the package after the browser boundary.

This preserves static generation and prevents vendor runtime/type leakage into the product model.

### Canonical raster export

Phase 1 PNG export painted the normalized matrix directly to Canvas. That was correct for black-square QR, but it would discard gradients and module/eye styling.

Phase 2A therefore uses:

```text
canonical generated SVG
→ browser image decoder
→ Canvas at an integer pixels-per-module size
→ PNG Blob
```

SVG export writes the canonical generated SVG directly.

## Phase 2B — Quality Assistant foundation

Phase 2B adds a Qraft-owned quality layer after rendering and before export decisions:

```text
GeneratedCode
├─ design + render metadata
│  → deterministic QR quality rules
│  → findings + metrics
│
└─ canonical SVG
   → explicit user self-test
   → representative local raster
   → lazy independent ZXing QR decoder
   → exact raw-payload comparison
```

The deterministic evaluator is pure domain logic. The decoder is a separate browser adapter so ZXing types do not enter `core/`, application contracts or React state.

### Findings and severity

The Phase 2B quality model uses:

- **Blocker** — known baseline violation,
- **High risk** — known serious risk or failed self-test,
- **Medium risk** — likely fragility,
- **Advisory** — placement/optimization guidance.

The preview summarizes deterministic findings as **Good / Check / Risk**. A failed local self-test elevates the visible summary to Risk.

No status is a certification claim.

### Quiet zone

Regular QR keeps a minimum four-module quiet zone. Qraft's current Safe Mode still locks the design model to at least four modules, while the independent quality rule remains in place as defense-in-depth for future imported/project states.

### Contrast and gradients

Qraft uses relative luminance and contrast ratio only as an explainable heuristic. It does **not** treat WCAG text thresholds as QR conformance rules.

Current heuristic labels are:

- Strong — minimum sampled ratio `>= 7:1`,
- Moderate — `>= 4.5:1` and `< 7:1`,
- Low — `< 4.5:1`,
- Placement dependent — transparent background.

For a gradient, Qraft samples both endpoints plus 25%, 50% and 75% positions and reports the weakest ratio rather than judging one endpoint.

### Inversion and ECC

- light modules on a darker solid background produce an inversion warning,
- a gradient that crosses background luminance is treated as higher risk,
- Level L paired with stronger styling produces ECC guidance to prefer more restoration headroom and run the final self-test.

These are product heuristics, not ISO certification.

### Local self-test

The self-test is deliberately explicit rather than silently running on every keystroke:

1. take the exact current canonical SVG,
2. rasterize it locally at a bounded reference size,
3. use a white representative placement surface for transparent art,
4. lazy-load the independent ZXing decoder adapter,
5. decode locally,
6. compare the decoded raw value with the exact encoded payload,
7. report pass, decode failure or payload mismatch without storing/exposing the payload in the result.

`@zxing/library` is isolated in `src/engines/decode/zxing/` and is dynamically imported only when the user runs the self-test. It is a replaceable compatibility adapter, not a domain dependency.

### Current limitations by design

Phase 2B does not yet claim:

- logo occlusion analysis — logo support ships with its own guardrails in Phase 2C,
- physical module-size guidance — that needs an explicit physical export/print-size input,
- multi-scale/blur stress testing — P1 after the single representative self-test is stable,
- certification or guaranteed scan reliability.

## Presets

Current shipped presets:

1. Pure Mono,
2. Qraft Mint,
3. Soft Mint,
4. Packaging.

Presets remain Qraft design data, not view conditionals or saved vendor option objects.

Phase 2B browser coverage explicitly self-tests every shipped preset so the roadmap's preset decode gate is exercised against real browser artifacts.

## Testing

Automated Phase 2 coverage now includes:

- design schema normalization/rejection,
- preset schema coverage,
- Qraft→vendor mapping,
- renderer routing and client-only designer behavior,
- styled SVG/PNG browser export,
- relative-luminance and gradient-sampling math,
- contrast/inversion/quiet-zone/ECC quality rules,
- self-test exact-match, mismatch and decoder-failure behavior,
- transparent-art representative placement,
- browser-level independent decode of every shipped preset,
- desktop/mobile Quality Assistant smoke coverage.

The same-package Phase 1 QR decoder remains only a structural regression oracle. Phase 2B's self-test uses an independent decoder implementation on the canonical visible artifact.

## Phase 2C — Local logo + safety guardrails

Phase 2C adds local logo support without putting user files into the portable design model:

```text
File input
→ raster signature + size/dimension preflight
→ browser decode
→ aspect-preserving square PNG normalization
→ short-lived object URL
→ RenderRequest.logoAsset
→ DesignerQrRenderer
→ self-contained canonical SVG
→ Quality Assistant + explicit local self-test
```

The portable `QraftQrDesign.logo` contains only visual geometry (`sizePercent`, `paddingModules`). The selected image itself is an ephemeral runtime asset and never becomes a `File`, `Blob`, base64 string or vendor option object in the core design state.

Current upload policy:

- PNG, JPEG and WebP only,
- 4 MiB maximum source file,
- 4096px maximum decoded/source dimension,
- 16-megapixel maximum source area,
- actual raster signatures are checked before browser decode,
- SVG is rejected in this slice instead of accepting active/external SVG content,
- decoded content is re-encoded locally as a bounded square PNG with the original artwork fitted without distortion,
- object URLs are revoked on replacement, removal and unmount.

The logo area is expressed as a Qraft-owned percentage of the QR symbol (excluding quiet zone), not the vendor package's `imageSize` coefficient. The designer adapter translates that geometry into the installed renderer's ECC-relative image budget and keeps vendor semantics inside `engines/`.

Quality Assistant estimates centered coverage from the Qraft logo area, compares it against approximate ECC restoration headroom, and exposes advisory/medium/high-risk findings. The conservative action returns the logo to 20% area, 0.5-module internal padding and ECC Q. These are product guardrails, not scan certification.

The exact logo-bearing SVG remains the canonical artifact. Logo rendering requests require the vendor output to contain an embedded PNG data URI rather than a `blob:` or external image reference, so SVG download and independent self-test exercise the final self-contained artifact.

## Remaining Phase 2 slices

Continue with JPEG/WebP export and the versioned `.qraft.json` project envelope. Phase 2 is complete only after the full roadmap gate remains green.
