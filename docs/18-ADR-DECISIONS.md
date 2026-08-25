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

## ADR-003 — Dual rendering engine

**Status:** Accepted

- styled QR adapter for creative normal QR,
- bwip adapter for standards/barcodes.

Reason:
styling breadth and barcode breadth are different optimization problems.

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
