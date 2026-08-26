# Phase 2B — Quality Assistant Foundation

## Goal

Turn Qraft's styling controls into an explainable, testable design system rather than allowing visual customization without scan-risk feedback.

This milestone intentionally precedes logo upload. A logo changes module occlusion and ECC recommendations, so its UI should land on top of an existing quality contract instead of inventing safety logic inside a component.

## Delivered scope

### Pure quality domain

`src/core/quality/` owns:

- quality severity and finding contracts,
- Good / Check / Risk summary semantics,
- QR quality metrics,
- relative-luminance/contrast math,
- multi-point gradient sampling,
- quiet-zone rule,
- contrast rule,
- inversion rule,
- ECC/styling guidance,
- rule registry/evaluator.

No renderer or decoder package is imported from `core/`.

### Independent artifact self-test

`src/core/quality/self-test.ts` defines a narrow artifact-decoder port.

`src/application/quality/self-test-qr.ts` owns the workflow:

```text
canonical SVG
→ bounded representative raster size
→ decoder port
→ exact raw comparison
→ pass / decode-failed / payload-mismatch
```

`src/engines/decode/zxing/zxing-qr-artifact-decoder.ts` is the current browser adapter. `@zxing/library` is dynamically imported only when the self-test is requested.

The result does not carry the raw payload. Qraft keeps payload comparison inside the application use case.

### UI integration

The preview's Quality Assistant exposes:

- Good / Check / Risk summary,
- contrast label and minimum sampled ratio,
- quiet-zone modules,
- QR version/module dimensions,
- ECC,
- explainable findings with a suggested fix,
- explicit Run self-test action,
- pass/failure state,
- non-certification disclaimer.

A self-test failure elevates the visible summary to Risk even if deterministic style heuristics were otherwise clear.

## Heuristic policy

The luminance formula and ratio math follow established sRGB/W3C definitions because they are explainable and deterministic. The numeric labels are **Qraft heuristics only**. WCAG text thresholds are not QR standards and must never be described as QR compliance.

Current labels:

- Strong `>= 7:1`,
- Moderate `>= 4.5:1`,
- Low `< 4.5:1`,
- Placement dependent for transparent output.

Gradient foregrounds are sampled at 0%, 25%, 50%, 75% and 100%; the weakest ratio drives the label.

## Standards baseline

For regular QR, DENSO documents a four-module clear margin around all sides. Current design validation already prevents less than four modules in Safe Mode; the quality rule remains independent as defense-in-depth.

ECC remains visible. Level M is the normal default; aggressive styling at Level L receives guidance rather than a false guarantee.

## Dependency decision

Phase 2B adds `@zxing/library@0.23.0` only for artifact self-decode.

Reasons:

- it provides the QR reader primitives needed without camera/UI helpers,
- it can be lazy-loaded behind the existing engine boundary,
- it is independent from Qraft's `qr` encoder and `qr-code-styling` renderer,
- the later Scanner phase can separately decide whether to add `@zxing/browser` for camera/image helpers.

Risk: the ZXing JS library is in maintenance mode. The adapter is therefore intentionally narrow and replaceable. Qraft must not expose ZXing classes or result objects outside `engines/`.

## Acceptance gate

Phase 2B is accepted when:

- deterministic quality-rule tests pass,
- self-test application tests pass,
- all shipped presets decode from their canonical browser SVG artifacts at the reference self-test size,
- exact raw payload comparison passes,
- desktop and mobile Quality Assistant interactions pass,
- lint/typecheck/build/Playwright gates remain green,
- UI uses risk/guidance language rather than certification language.

## Deferred to Phase 2C+

- logo upload and asset validation,
- logo size/padding and occlusion rule,
- physical print module size,
- multi-scale/blur stress tests,
- JPEG/WebP,
- `.qraft.json`.
