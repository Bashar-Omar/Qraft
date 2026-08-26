# 18 — Architecture Decision Records

## ADR-001 — Client-side-first generation

**Status:** Accepted

Qraft generation, user assets, scan uploads, CSV and normal exports run in the browser.

Why:

- privacy,
- cost,
- speed,
- self-hosting,
- offline potential.

Trade-off:

- browser resource limits,
- no first-party dynamic redirect.

---

## ADR-002 — No first-party dynamic QR in v1

**Status:** Accepted

Editable-after-print codes require a stable redirect URL + persistent destination state.

Qraft v1 does not fake dynamic QR.

Future option:

- BYO redirect provider,
- separate cloud service boundary.

---

## ADR-003 — Specialized rendering engines

**Status:** Accepted / refined in ADR-013

- standards-first QR adapter for the safe baseline,
- styled QR adapter for creative normal QR,
- bwip adapter for industrial/barcode breadth.

Reason:
standard QR correctness, creative styling breadth and barcode breadth are different optimization problems. Each engine remains replaceable behind Qraft-owned ports.

---

## ADR-004 — Vendor libraries behind ports

**Status:** Accepted

No encoder/decoder package types outside `engines/`.

Protects:

- domain,
- UI,
- project schema,
- testability.

---

## ADR-005 — Native scanner + ZXing fallback

**Status:** Accepted

`BarcodeDetector` is feature-detected. ZXing provides compatibility.

---

## ADR-006 — Progressive symbology catalog

**Status:** Accepted

Use:

- Curated,
- Expert,
- Experimental.

Never dump 100+ choices into primary UX.

---

## ADR-007 — Portable projects instead of accounts

**Status:** Accepted

Versioned `.qraft.json` is the default persistence/share artifact.

Requires migration discipline.

---

## ADR-008 — Qraft owns design model

**Status:** Accepted

Saved styles use Qraft domain names, not `qr-code-styling` option objects.

This keeps saved projects stable across renderer replacement/upgrades.

---

## ADR-009 — Prefer static export, validate before locking

**Status:** Proposed/validate

Attempt a fully static Next.js app. If a justified feature needs server runtime, document it.

---

## ADR-010 — Geist initially

**Status:** Accepted

Reference uses General Sans + Geist Mono.

Initial public implementation:

- Geist Sans,
- Geist Mono.

Add General Sans only after license/distribution confirmation.

---

## ADR-011 — No generic pre-styled design kit

**Status:** Accepted

Radix may provide accessible primitives. Qraft provides all visual styling.

Goal:
avoid generic AI/shadcn clone appearance.

---

## ADR-012 — Quality findings, not certification

**Status:** Accepted

Quality Assistant exposes transparent checks + local self-decode.

No certification language without an actual certification process.

---

## ADR-013 — Prove a standard QR baseline before designer styling

**Status:** Accepted

Phase 1 uses `qr@0.6.0` behind `StandardQrRenderer` for the first production QR path.

Reasons:

- zero runtime dependencies,
- built-in TypeScript declarations,
- browser and Node support,
- raw matrix output that Qraft can own and export itself,
- QR versions 1–40 and all four standard error-correction levels,
- decoding support suitable for software regression vectors,
- recent 0.6.0 security/spec self-audit and TypeScript 5.9+ compatibility work.

Boundary:

- `qr` imports are allowed only inside `src/engines/` and engine-focused tests,
- UI/application/domain code consumes Qraft-owned types,
- Qraft generates its own SVG/PNG artifacts from the normalized matrix,
- designer QR styling is a separate future adapter and does not redefine the safe standard baseline.

Testing caveat:

A render→decode round trip using the same library is a useful regression gate, not independent scanner certification. Later hardening must add independent decoder/device fixtures.

---

## ADR-014 — Canonical styled SVG with a separate verification matrix

**Status:** Accepted

Phase 2 uses `qr-code-styling@1.9.2` behind a browser-only adapter for creative QR rendering. The dependency is dynamically imported only inside the adapter because eager imports have historically caused `window`/`self` failures in Next.js server execution.

Qraft continues to run `StandardQrRenderer` as a structural oracle for payload/version/ECC/quiet-zone metadata and software golden vectors. A designer engine can legally choose a different QR mask, so its visible artifact must not be reconstructed from the standard engine's matrix.

Therefore:

- `RenderedCode.svg` is the canonical visible/export artifact,
- `RenderedCode.verificationMatrix` is the standards-oriented reference,
- PNG is rasterized from the canonical SVG,
- the default Pure Mono design remains on the lightweight standard renderer,
- styled requests are routed to the designer adapter without UI vendor conditionals,
- designer runtime imports are browser-only and lazy,
- vendor option types never enter Qraft design state,
- gradient degrees are converted to vendor radians only in the adapter,
- logo support waits for Quality Assistant guardrails.
