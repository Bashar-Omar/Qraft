# 03 — Information Architecture & UX

## Primary navigation

- **Generate**
- **Scan**
- **Batch**
- **Guides**

Secondary:

- Theme,
- GitHub,
- Privacy/About.

No bloated dashboard sidebar.

## Generate mental model

Four conceptual stages, without forcing a wizard:

1. **Type**
2. **Content**
3. **Style**
4. **Export**

Quality remains persistent.

## Desktop ≥ 1280px

Three-pane studio:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Qraft       Generate  Scan  Batch  Guides                  Theme/GH  │
├────────────┬──────────────────────────────┬──────────────────────────┤
│ Type       │ Content / Style             │ Sticky live preview      │
│ navigator  │                              │ Quality                  │
│ 220–260px  │ fluid                        │ Export                   │
└────────────┴──────────────────────────────┴──────────────────────────┘
```

The code remains visible while editing.

## Laptop 1024–1279px

Two-pane:

- editor,
- sticky preview,
- type catalog in drawer/popover.

## Tablet

- preview above editor or collapsible sticky card,
- Content / Style / Quality / Export tabs,
- no squeezed desktop sidebar.

## Mobile

Design a separate responsive composition:

- compact header,
- prominent preview,
- full-height type sheet,
- Content / Style / Quality segmented navigation,
- sticky bottom Download,
- advanced accordions,
- ≥44px touch targets.

## Type picker

### Default

Popular:

- URL,
- Wi‑Fi,
- Contact,
- WhatsApp,
- Email,
- Text,
- Event,
- Location.

Barcodes:

- Code 128,
- EAN-13,
- UPC-A,
- Code 39,
- Data Matrix,
- PDF417,
- Aztec.

Advanced:

- GS1,
- Micro QR,
- rMQR,
- Expert Catalog.

### Expert catalog

Search by:

- name/alias,
- family,
- use-case/domain.

Filters:

- 1D/2D,
- retail,
- GS1,
- postal,
- healthcare,
- matrix/stacked/compact.

Each item shows:

- short purpose,
- input constraint,
- capability badges,
- advanced/domain badge.

## Content editor rules

- common payloads get hand-designed editors,
- expert formats may use schema-driven generic forms,
- examples and inline validation,
- errors after interaction, not aggressive red on first render,
- preview can retain last-valid result while form is temporarily invalid.

Smart defaults:

- URL starts with `https://`,
- Wi‑Fi WPA/WPA2,
- QR ECC M,
- suggest Q/H with large logo,
- safe quiet zone,
- SVG recommended for vector/print,
- PNG 1024/1200px default.

## Preview card

Includes:

- rendered code,
- light/dark/checker placement surface,
- pixel/physical size,
- quality/self-test badge,
- format/ECC/version/byte metadata where relevant.

Actions:

- Download,
- Copy,
- Fullscreen,
- Self-test.

## Quality panel

Severity:

- Error,
- Risk,
- Info.

Every finding answers:

1. what was detected,
2. why it matters,
3. how to fix it.

Prefer one-click fixes.

## Export UX

Quick Download = current default immediately.

Adjacent disclosure opens full Export Studio:

- format,
- dimensions,
- filename,
- background,
- print controls.

Do not force a modal for every download.

## Scan flow

```text
Scan
→ Camera or Upload
→ explicit permission
→ detection
→ freeze result
→ raw + parsed inspector
→ Copy / Open / Create in Qraft / Scan again
```

Never auto-open URLs.

## Batch flow

1. Choose payload/code type.
2. Upload/download CSV template.
3. Map columns.
4. Validate.
5. Apply design preset.
6. Preview samples.
7. Choose ZIP/PDF.
8. Generate with progress/cancel.
9. Download locally.

## Micro-interactions

Use motion for causality:

- preview crossfade/morph,
- quality badge transition,
- drawer/panel transitions,
- download success.

Avoid:

- animated-gradient wallpaper,
- excessive parallax,
- bouncing on every click,
- constant glow.

## Keyboard

Suggested:

- `Ctrl/Cmd+K` command palette,
- `Ctrl/Cmd+Z` undo,
- `Shift+Ctrl/Cmd+Z` redo,
- `Ctrl/Cmd+S` save `.qraft.json` when studio focused,
- `Ctrl/Cmd+Enter` self-test.

All shortcuts require visible alternatives.
