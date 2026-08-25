# AGENTS.md — Qraft Engineering Contract

This is a portfolio-quality public product. Humans and coding agents must treat it like a maintained production application.

## Product constraints

- Qraft is free and client-side-first.
- Do not add auth, cloud DB, hosted history, tracking, or paid APIs unless an ADR explicitly approves them.
- Uploaded logos/images/CSV and normal generated content stay in the browser by default.
- Never claim a code is “certified” or guaranteed to scan. Qraft may provide heuristics and local decode self-tests.
- True dynamic/editable QR is outside core scope without a redirect backend.

## Architecture constraints

- UI must not import QR/barcode vendor libraries directly.
- Encoders, decoders and exporters are accessed through application ports.
- Payload encoding/parsing is pure domain logic.
- No giant `switch` for code types; use registries/strategies.
- New payload/code types should be additive.
- Feature folders own orchestration; shared UI stays product-agnostic.
- Prefer composition over inheritance.

## TypeScript

- `strict: true`.
- No unexplained `any`.
- Validate untrusted inputs at boundaries.
- Use discriminated unions/exhaustive checks.
- Keep vendor option types inside adapters.

## UI

- Follow `docs/04-DESIGN-SYSTEM.md`.
- Avoid a generic shadcn-looking product.
- Radix can provide behavior; Qraft owns appearance.
- Mint is action/status accent, not decorative noise.
- Blur/glass is subtle.
- Honor reduced motion.
- Everything interactive is keyboard accessible.

## Quality gates

Before merge:

- lint,
- typecheck,
- unit/contract tests,
- production build,
- critical Playwright flows.

Encoder changes require known vectors and round-trip decode tests where decoder support exists.

## Performance

- Lazy-load heavy render/scan packages.
- Keep the 100+ barcode catalog out of initial UI/bundle where possible.
- Use workers for batch/large raster work when beneficial.
- Avoid global-state re-renders of the live preview.

## Security/privacy

- No remote upload for user assets in normal operation.
- Do not inject untrusted SVG/HTML blindly.
- Validate `.qraft.json` and CSV imports.
- Revoke object URLs.
- Never log sensitive payload values to analytics/production console.

## Commit style

Prefer conventional commits:
`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`, `a11y:`.

Keep commits/PRs reviewable and include desktop/mobile screenshots for UI work.
