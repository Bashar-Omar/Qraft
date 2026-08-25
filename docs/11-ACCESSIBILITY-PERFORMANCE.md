# 11 — Accessibility & Performance

## Accessibility target

Aim for **WCAG 2.2 AA** for the app interface.

This is separate from QR contrast diagnostics.

## Keyboard

Every action:

- semantic control,
- visible focus,
- logical order,
- Escape on overlays,
- focus return after close.

No:

- clickable divs,
- hover-only actions,
- pointer-only export.

## Radix use

Good candidates:

- Dialog,
- Dropdown,
- Popover,
- Tabs,
- Tooltip,
- Slider.

Qraft owns all appearance.

## Screen reader behavior

### Preview

Do not announce code changes on every keystroke.

Use a debounced polite status only for meaningful state:

- rendered,
- invalid,
- self-test result.

### Quality

Findings use semantic list + text severity, not color only.

### Scanner

Announce:

- camera ready,
- code detected,
- result type,
- error.

## Color/state

Mint cannot be the only selected-state cue.

Combine:

- border,
- check/icon,
- label,
- background,
- ARIA state.

## Reduced motion

Respect `prefers-reduced-motion`.

Remove:

- non-essential transform,
- animated backgrounds,
- lengthy layout movement.

## Touch

Generally ≥44×44 CSS px.

Avoid rows of tiny icon-only buttons on mobile.

## Responsive rendering

Do not mount a heavy 3-pane desktop tree and merely hide it on mobile if hidden components still run expensive work.

Use lazy/responsive composition where worthwhile.

## Performance budgets

### Landing

- no barcode renderer/scanner in initial bundle,
- strong Core Web Vitals.

### Generate

- basic QR quickly after interaction,
- styled engine only when needed,
- bwip lazy when barcode chosen.

### Scan

- ZXing not in Generate initial chunk.

### Batch

- ZIP/PDF/worker code only when Batch requires it.

## Lazy-load map

```text
Landing:
  no engines

Generate / normal QR:
  core + designer QR

Generate / barcode:
  lazy bwip

Scan:
  native detector
  lazy ZXing fallback

Batch:
  lazy renderer
  lazy ZIP/PDF
```

## Main-thread responsiveness

- debounce expensive renders,
- use React transitions where useful,
- workers for batch/large raster,
- bounded concurrency,
- no huge synchronous loops.

## Preview fingerprints

Separate:

- payload fingerprint,
- design fingerprint,
- export-only config.

Do not regenerate code for unrelated UI changes.

## Fonts/images

- self-host legal font subsets,
- keep logo SVG vector,
- optimize marketing media.

## Testing

Automated:

- axe,
- Playwright keyboard flows.

Manual:

- VoiceOver,
- Windows screen reader,
- keyboard-only,
- 200% zoom,
- mobile,
- reduced motion,
- high contrast mode where practical.

## Performance CI

After baseline:

- Lighthouse CI,
- bundle snapshots,
- fail only on meaningful regressions.
