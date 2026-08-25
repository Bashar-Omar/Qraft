# 04 — Qraft Design System

Derived from the supplied references and Qraft SVG.

## Reference-derived palette

```css
--qraft-mint: #0fbf8f;
--qraft-on-mint: #04120d;
--qraft-slate: #1b1f24;
--qraft-mint-wash: #e2f5ee;
--qraft-paper: #f3f5f2;
--qraft-card: #ffffff;
--qraft-signal-red: #d64545;
```

The reference shows amber `#E0A44C` as a **retired** accent. Do not make it a normal Qraft action color.

## Color philosophy

**Mint is the color that acts.**

Use mint for:

- primary CTA,
- active/selected,
- successful quality/self-test,
- focused brand accent.

Do not spray mint decoratively.

Slate = ink/headings.  
Paper = primary app background.  
Mint Wash = selected/soft positive fill.  
Signal Red = destructive/error only.

Suggested semantic tokens:

```css
--surface-0: var(--qraft-paper);
--surface-1: var(--qraft-card);
--text-primary: var(--qraft-slate);
--text-secondary: color-mix(in srgb, var(--qraft-slate) 66%, transparent);
--border-soft: color-mix(in srgb, var(--qraft-slate) 10%, transparent);
```

## Dark theme

Recommended derived values, not directly read from the reference:

```css
--surface-0: #111417;
--surface-1: #181c20;
--surface-2: #1e2328;
--text-primary: #f3f5f2;
--text-secondary: rgba(243, 245, 242, 0.68);
--border-soft: rgba(243, 245, 242, 0.1);
--accent: #0fbf8f;
--accent-ink: #04120d;
```

Validate final contrast.

## Typography

Reference:

- General Sans for display/body,
- Geist Mono for labels/data.

Open-repo implementation recommendation:

- **Geist Sans**
- **Geist Mono**

This preserves a modern Vercel/SaaS tone with clean licensing. Add General Sans later only after confirming intended redistribution/license.

Suggested scale:

| Token      |                   Size | Weight | Use               |
| ---------- | ---------------------: | -----: | ----------------- |
| Display XL | `clamp(48px,6vw,88px)` |    640 | hero              |
| Display    |                  48–64 |    640 | marketing section |
| App H1     |                     32 |    640 | route heading     |
| H2         |                     24 |    620 | panels            |
| H3         |                     18 |    600 | cards             |
| Body       |                  15–16 |    420 | app               |
| Small      |                  13–14 |    450 | support           |
| Mono       |                  10–12 |    520 | labels/data       |

## Logo

The supplied `Logo.svg` is path-based, white, transparent, viewBox `0 0 1080 364.8`.

Rules:

1. preserve original path geometry,
2. keep pristine original source,
3. create an application component that supports permitted semantic colors,
4. variants:
   - white on slate,
   - slate on paper/card,
   - on-mint ink on mint,
5. no arbitrary gradient/stroke/shadow/distortion.

## Geometry

Recommended radii:

- 8 tiny,
- 12 controls,
- 16 cards,
- 20 primary panels,
- 24 preview/dialog,
- 28 hero shells.

Do not make everything a pill.

## Spacing

4px base; primary steps:
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`.

## Borders/shadows

Prefer precision over floatiness:

- 1px soft border,
- very low elevation,
- shadows only for hierarchy.

Example:

```css
box-shadow:
  0 1px 2px rgba(4, 18, 13, 0.03),
  0 8px 32px rgba(4, 18, 13, 0.04);
```

## Glass / blur

Use selectively:

- top nav,
- mobile sticky action bar,
- floating toolbar,
- command palette,
- preview overlay.

Recommended:

- translucent surface,
- 12–24px backdrop blur,
- soft border.

Avoid stacking glass behind every form.

## Buttons

Primary:

- mint,
- on-mint ink,
- 44–48px height,
- disciplined press feedback.

Secondary:

- card/surface,
- border,
- slate.

Inputs:

- external label,
- card fill,
- quiet border,
- mint focus ring,
- never placeholder-only labeling.

## Motion

Tokens:

- fast 120–160ms,
- standard 180–240ms,
- slow 320–420ms.

Motion library only for layout/high-value transitions; CSS for simple hover/focus.

Honor reduced motion.

## Signature motif

The references combine editorial headings with tiny mono technical labels.

Use:

- `GENERATE / QR / URL` breadcrumb-label language,
- metadata under preview,
- precise divider/grid lines in marketing sections,
- mint active markers,
- large typography.

Avoid making the actual editor a poster.

## Initial presets

1. Qraft Mint
2. Pure Mono
3. Dark Glass
4. Soft Mint
5. Packaging
6. Receipt
7. Minimal Frame
8. Brand Logo Safe

Presets are data, not hard-coded view logic.
