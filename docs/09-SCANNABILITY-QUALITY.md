# 09 — Scannability & Quality Assistant

## Promise

Qraft helps users make attractive, robust codes.

It must not imply formal certification.

Use:

- “Passed local self-test”
- “Potential scan risk”
- “Recommended”
- “May reduce reliability”

Avoid:

- “Guaranteed”
- “Certified scan-safe”

## Primary QR rules

DENSO documents:

- L/M/Q/H error correction,
- versions 1–40,
- four-module quiet zone for regular QR,
- different Micro QR characteristics,
- rMQR rectangular variant.

Therefore rules are format-specific.

## Quality pipeline

```text
validate data
→ render
→ inspect design
→ deterministic geometry rules
→ raster test if needed
→ local decoder self-test
→ findings
```

## Severity

- **Blocker** — cannot create valid output.
- **High risk** — known violation/self-test failure.
- **Medium risk** — likely fragility.
- **Advisory** — optimization.

## Quiet zone

Safe Mode:

- do not export below safe required/recommended margin.

Creative Mode:

- if renderer can do less, show a prominent risk.

Regular QR default = four modules.

## Contrast

Use luminance/contrast as a heuristic.

Important:
WCAG text contrast is not a QR-code compliance standard. Never label a 4.5:1 value as “QR compliant.”

UI language:

- Strong,
- Moderate,
- Low.

## Inversion

Light modules on dark background can reduce compatibility.

Warn, especially with gradients.

## Gradients

Sample multiple regions; never judge only one endpoint.

## Logo occlusion

Estimate:

- logo rectangle,
- center coverage,
- density,
- ECC.

Offer one-click safer logo size/ECC.

## ECC

Default M for normal code. Suggest Q/H for logo/aggressive styling.

Explain that higher ECC also increases density/capacity trade-offs.

## Density/version

As content grows:

- module count/density rises,
- small output becomes harder.

Show:

- module/version info,
- physical module size when print dimensions exist.

## Self-test

For supported codes:

1. rasterize representative output,
2. decode locally,
3. compare exact raw value,
4. pass/fail.

P1 stress test:

- different scales,
- mild blur/downscale,
- relevant light/dark placement.

Do not turn synthetic tests into fake certification.

## Example detail

```text
SELF TEST
✓ Decoded locally
✓ Payload matches exactly
✓ Quiet zone: 4 modules
✓ Strong visual contrast
! Logo center coverage is high
```

## Physical module size

```text
module_size_mm =
  final_symbol_width_mm /
  total_modules_including_quiet_zone
```

Use as guidance only. Camera optics, print quality, distance, density and format affect real results.

## Linear barcode quality

Check:

- bar/module width,
- height,
- quiet zones,
- human-readable text,
- pixel alignment.

For raster:

- avoid fractional scaling that blurs bars/modules.

## Quality score

If implemented, show transparent subscores and label it explicitly a **Qraft heuristic**.

A simple:

- Good,
- Check,
- Risk

may be more honest for v1.
