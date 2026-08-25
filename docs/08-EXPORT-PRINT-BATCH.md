# 08 — Export, Print & Batch

## Export is a product subsystem

Do not implement export as random `canvas.toDataURL()` inside a component.

Create application/exporter contracts and test actual artifacts.

## v1 formats

### SVG

Preferred for:

- web,
- Illustrator/Figma,
- scaling,
- print.

Rules:

- deterministic viewBox/dimensions,
- safe SVG,
- quiet zone preserved,
- no user-injected scripts/event handlers.

### PNG

- alpha/transparency,
- 512/1024/2048/custom,
- print/web.

### JPEG

- compatibility,
- always solid background.

### WebP

- modern raster.

### PDF

Modes:

1. code-only artboard,
2. print-sheet layout.

Do not rasterize vector QR into PDF unnecessarily.

## EPS

Competitors advertise it, but reliable browser-side EPS is easier to get wrong.

Recommendation:

- P2,
- implement only after a proven vector path and Illustrator/Acrobat test set.

Five correct formats are better than six with one fragile.

## Export request model

```ts
type ExportRequest = {
  format: "svg" | "png" | "jpeg" | "webp" | "pdf";
  filename: string;
  pixelSize?: { width: number; height: number };
  physicalSize?: { value: number; unit: "mm" | "in" };
  dpi?: number;
  background?: string | "transparent";
};
```

## Physical size

Make math transparent:

```text
pixels = inches × DPI
inches = millimeters / 25.4
```

Show pixel and physical values together.

Do not imply that changing DPI metadata invents image detail.

## Print Studio

Settings:

- mm/in,
- code size,
- A4/Letter/custom,
- orientation,
- margins,
- rows/columns,
- gap,
- guides/crop marks optionally,
- label templates later.

Preview:

- actual page proportions,
- size annotation,
- safe clear zone.

### Print Safe preset

One click:

- solid background,
- high contrast,
- conservative module style,
- standard quiet zone,
- conservative/no logo,
- vector output recommended.

## Batch pipeline

```text
CSV
→ parse
→ map columns
→ validate rows
→ normalize payloads
→ queue
→ worker/bounded concurrency
→ artifacts
→ ZIP/PDF
```

React should not render a hidden canvas for every row.

## Batch memory

Avoid:

- hundreds of base64 strings,
- unlimited concurrent renders,
- object URL leaks.

Prefer:

- Blob/ArrayBuffer,
- incremental generation,
- bounded concurrency,
- progressive cleanup,
- workers where useful.

## CSV robustness

- UTF‑8,
- quoted delimiters/newlines,
- optional delimiter detection,
- file/row limits with clear explanation,
- never execute formulas,
- protect generated error/report CSV from spreadsheet formula injection.

## Column mapper

Example:

```text
CSV:
wifi_name | password | security | hidden

Map:
SSID      ← wifi_name
Password  ← password
Security  ← security
Hidden    ← hidden
```

## Error table

| Row | Status | Field | Problem | Fix |
| --: | ------ | ----- | ------- | --- |

Actions:

- errors only,
- error report,
- retry corrected,
- skip invalid.

## Filename template

```text
{index}-{type}-{slug}.{ext}
```

Allow safe placeholders from mapped fields.

Sanitize:

- slash/backslash,
- Windows reserved chars,
- control chars,
- duplicate names.

## Professional ZIP

```text
qraft-export/
  manifest.json
  codes/
    001-item.svg
    002-item.svg
  errors.csv
```

Manifest can contain:

- Qraft version,
- generation timestamp,
- non-sensitive config,
- type,
- row-to-file mapping.

Avoid storing sensitive raw payloads unless required/opted in.

## Determinism

Same payload + design + renderer version + export config should produce reproducible output as far as practical.

Record relevant app/renderer versions in project/batch metadata when useful.
