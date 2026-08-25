# 20 — Coding Agent Brief

Use when handing Qraft to GLM, Claude, Codex, Copilot or another implementation agent.

## Mission

Build **Qraft**, a premium, free, privacy-first QR/barcode studio for a public portfolio repository.

Quality bar: maintained creative/SaaS tool, not a demo form.

## Non-negotiables

1. Read `AGENTS.md` + relevant `/docs`.
2. Preserve Qraft identity.
3. No account/database/cloud history v1.
4. Generation and user files are browser-first.
5. Strict TypeScript.
6. Vendor libraries stay behind adapters.
7. Registries/strategies; no giant switches.
8. Tests for core paths.
9. Responsive design is intentional.
10. No generic shadcn visual clone.
11. Dependencies require justification.
12. No true dynamic QR without backend ADR.
13. No scan-certification claims.
14. Do not sacrifice quiet zone/contrast silently for aesthetics.

## Initial stack direction

- latest patched stable Next.js App Router,
- React + TS strict,
- Tailwind + Qraft tokens,
- Geist Sans/Mono,
- Radix behavior primitives,
- Zustand,
- Zod + React Hook Form,
- styled QR adapter,
- bwip adapter,
- BarcodeDetector + ZXing fallback,
- Vitest + Playwright.

Verify versions before install.

## First milestone

Deliver:

- clean app shell,
- Qraft light/dark theme,
- type picker,
- URL + text,
- safe standard QR,
- live preview,
- SVG + PNG,
- render/decode golden test,
- desktop/mobile layouts,
- CI.

Do **not** start by exposing 100 formats before architecture is proven.

## Architecture proof

Adding one payload should require:

```text
schema
codec
metadata
editor
tests
```

not edits across unrelated components.

Adding a renderer should implement a port without changing payload codecs.

## UI direction

Reference:

- Paper `#F3F5F2`
- Card `#FFFFFF`
- Slate `#1B1F24`
- Mint `#0FBF8F`
- On-mint `#04120D`
- Mint Wash `#E2F5EE`
- Signal Red `#D64545`

Visual:

- editorial premium,
- modern technical SaaS,
- disciplined mono labels,
- subtle glass,
- comfortable spacing,
- high-quality micro-interactions.

Avoid:

- purple AI gradients,
- neon glow,
- random blobs,
- excessive radius,
- component-kit defaults.

## Desktop studio

- top nav,
- left type rail,
- center content/style,
- right sticky preview/quality/export.

## Mobile studio

- preview stays important,
- full-screen type sheet,
- Content/Style/Quality,
- sticky Download,
- no compressed sidebar.

## Agent reporting per milestone

Report:

1. files changed,
2. architecture decisions,
3. tests added,
4. manual checks,
5. unresolved risks,
6. recommended next issue.

Never hide failures behind “should work.”

## Feature quality

A feature is accepted when:

- domain logic correct,
- UI coherent,
- mobile/keyboard work,
- export verified,
- tests prove contract,
- error state designed,
- codebase is easier—not harder—to extend.
