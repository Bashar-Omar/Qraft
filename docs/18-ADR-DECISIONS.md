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

---

## ADR-015 — Independent local artifact self-test behind a decoder port

**Status:** Accepted

Phase 2B validates the exact canonical QR SVG with an independent decoder rather than treating the encoder's own round-trip tests as sufficient evidence.

Decision:

- deterministic quality heuristics remain pure Qraft domain logic,
- the user explicitly runs artifact self-test rather than paying decoder cost on every keystroke,
- the canonical SVG is rasterized locally at a bounded representative size,
- transparent art is tested on a documented white representative surface,
- decoded raw data must exactly equal the generated raw payload,
- the result exposes only pass/failure reason, not the payload,
- `@zxing/library@0.23.0` is isolated behind `QrArtifactDecoder` and dynamically imported in the browser,
- a self-test failure elevates the visible Quality Assistant summary to Risk,
- the UI never calls a synthetic pass "certified" or "guaranteed".

Why use the narrow library package now:

Phase 2B needs QR image-decoder primitives, not camera/session helpers. The later Scanner phase can evaluate `@zxing/browser` separately. This avoids coupling today's self-test to tomorrow's camera UI.

Risk:

The ZXing JS library is in maintenance mode. The adapter boundary is therefore mandatory and keeps a future replacement local to `engines/decode/`.

---

## ADR-016 — Rasterize local logo input and separate portable geometry from runtime asset

**Status:** Accepted

Phase 2C accepts PNG/JPEG/WebP logos locally, verifies real raster signatures and bounded dimensions, decodes them in the browser and re-encodes them onto an aspect-preserving square PNG canvas before rendering.

Decision:

- raw SVG logo upload is rejected in this slice rather than injected/sanitized incompletely,
- the portable design model stores only logo size/padding geometry,
- runtime image bytes are represented only by a short-lived object URL at the render boundary,
- object URLs are revoked on replacement/removal/unmount,
- rectangular source art is fitted into a square transparent PNG to avoid renderer aspect-ratio distortion,
- the designer adapter alone maps Qraft logo geometry to vendor image settings,
- logo-bearing SVG must embed the normalized PNG and may not leave a blob/external reference,
- Quality Assistant estimates logo occlusion separately from vendor calculations,
- independent self-test runs on the exact final logo-bearing canonical SVG.

Why:

This preserves privacy, avoids serializing browser/vendor state, keeps `.qraft.json` design data migration-friendly and makes the renderer replaceable without redefining saved logo controls.

---

## ADR-017 — Shared canonical raster pipeline with exact MIME verification

**Status:** Accepted

PNG, JPEG and WebP exporters rasterize `RenderedCode.svg` through one browser adapter. Raster-size policy is Qraft-owned core data; Canvas details remain in `engines/`.

Decision:

- preserve integer pixels-per-module,
- PNG/WebP may preserve alpha,
- JPEG always paints a solid white base,
- request lossy encoders at quality 0.92,
- verify the returned Blob MIME exactly,
- fail clearly if the browser silently falls back to another format.

This prevents extension/MIME mismatches and keeps all raster formats faithful to the same canonical styled artifact.

---

## ADR-018 — `.qraft.json` v1 is explicit, versioned and rebuilt into fresh domain objects

**Status:** Accepted

`.qraft.json` becomes Qraft's account-free persistence artifact.

Decision:

- schema v1 stores Qraft payload input, QR/ECC/design and export-size settings,
- project import has a file-size cap, JSON depth/node limits and strict supported keys,
- prototype-sensitive payload keys are rejected,
- migration is explicit `n → n+1`; newer versions fail instead of being guessed,
- imported payload data is checked again by the current payload codec,
- no unsafe deep merge,
- optional normalized PNG logo data is bounded and re-inspected on import,
- runtime Blob/object URL values never enter the core project schema.

This keeps saved projects stable across renderer replacements while preserving the privacy-first local workflow.

---

## ADR-017 — Standards-backed structured payloads before Event/Raw expansion

**Status:** Accepted

Phase 3 begins with vCard 4.0, WhatsApp Click to Chat and RFC 5870 `geo:` URIs.

Decision:

- use the current IETF vCard format for the curated Contact encoder,
- use WhatsApp's documented HTTPS `wa.me` link rather than a custom URL scheme,
- use provider-neutral RFC 5870 `geo:` rather than hard-coding Google/Apple Maps,
- keep all three behind the existing `PayloadCodec` and editor registries,
- defer Event to Phase 3B so RFC 5545 UID/DTSTAMP/time-zone determinism is designed explicitly,
- defer Raw mode until the curated structured payload boundary remains proven.

Why:

The three payloads add meaningful user breadth with minimal architectural surface and preserve the existing local/project/export pipeline unchanged.
