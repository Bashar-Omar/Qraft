# Phase 2C — Local Logo + Safety Guardrails

## Status

Phase 2C adds branded-center support on top of the completed Visual Studio and Quality Assistant foundations.

The goal is not merely to place an image over a QR. The selected asset must stay local, be bounded and decoded as a real raster image, preserve its aspect ratio, integrate with the Qraft-owned design model without vendor leakage, participate in quality findings and be covered by the exact final-artifact self-test.

## Product contract

Supported source formats:

- PNG,
- JPEG,
- WebP.

Current bounds:

- maximum source file: 4 MiB,
- maximum dimension: 4096px,
- maximum source area: 16 megapixels,
- Qraft logo area: 16–26% of QR symbol width,
- internal padding: 0 / 0.5 / 1 module.

SVG logo upload is deliberately rejected in this slice. SVG can contain script, event handlers and external resources; Qraft will not inject user SVG markup into a canonical export without a separately designed sanitizer/rasterization policy.

## Local asset lifecycle

```text
File
→ byte-signature + dimension inspection
→ browser image decode
→ aspect-preserving square Canvas
→ PNG Blob
→ object URL
→ renderer runtime asset
→ embedded PNG in canonical SVG
```

The source `File` and normalized `Blob` do not enter global/product state. `GenerateStudio` holds only a short-lived object URL plus non-sensitive display metadata. The URL is revoked on replace, remove and unmount.

The portable design model stores only:

```ts
logo?: {
  sizePercent: number;
  paddingModules: number;
}
```

That separation is required so future `.qraft.json` work can define asset embedding/migration independently instead of accidentally serializing browser object URLs or renderer-specific objects.

## Why normalize to a square PNG

The current designer dependency has a long-standing open issue around rectangular logo aspect-ratio distortion. Qraft therefore decodes the source and fits it into a square transparent canvas before it reaches the adapter. The source art keeps its aspect ratio; the renderer receives predictable square geometry; metadata and unrelated source bytes are discarded by re-encoding.

This is also a security boundary: the canonical QR only receives Qraft-generated raster content, never raw uploaded SVG/HTML.

## Renderer adapter

`QraftQrDesign.logo.sizePercent` describes a portable centered clearance-area percentage of the QR symbol, excluding quiet zone.

`qr-code-styling` instead exposes an ECC-relative `imageSize` coefficient. The conversion happens only in `DesignerQrRenderer`:

```text
coverage fraction = (sizePercent / 100)²
vendor imageSize = coverage fraction / approximate ECC recovery fraction
```

The adapter also maps padding modules to renderer pixels, enables background-dot hiding and requires SVG image embedding (`saveAsBlob`).

When a logo is present, canonical SVG validation rejects output that omits the logo or leaves an external/blob image reference. Export must be self-contained.

## Quality guardrails

The logo quality rule uses:

- centered logo rectangle,
- estimated covered symbol area,
- selected ECC,
- existing symbol density/version metadata.

It reports explainable guidance rather than a certificate. A logo at Level M receives a stronger-ECC advisory; geometry using a larger share of approximate ECC restoration headroom becomes Medium or High risk.

The conservative action uses:

- 20% centered area,
- 0.5-module internal padding,
- ECC Q.

The user should still run the explicit local self-test on the final design.

## Testing gate

Phase 2C automation covers:

- portable logo-config validation,
- PNG/JPEG/WebP signature and dimension inspection,
- rejection of SVG/text bytes and oversized sources,
- Qraft-logo → vendor image-option mapping,
- logo routing through the designer adapter,
- logo occlusion/ECC findings,
- browser upload + normalization,
- final canonical SVG contains an embedded PNG rather than a blob URL,
- independent local self-decode of the final logo-bearing artifact,
- logo removal returns an otherwise-default QR to the standard renderer.

Desktop and mobile Chromium run the same user flow. Physical-device scanning remains a later release-hardening gate and no synthetic result is described as certification.
