# Contributing to Qraft

Qraft is a public portfolio product, so correctness, UX, accessibility and maintainability are all merge criteria.

## Before a PR

1. Read `AGENTS.md`.
2. Read the relevant `/docs`.
3. Keep changes focused.
4. Add tests for behavior changes.
5. Run the full local quality suite.

Suggested scripts after implementation:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Adding a QR payload type

Include:

- stable `typeId`,
- metadata/category,
- schema,
- typed data model,
- encoder,
- parser/inspector where meaningful,
- human-readable preview,
- safe sample,
- unit tests,
- editor definition/component.

Do not place serialization logic inside React views.

## Adding a barcode symbology

Define:

- stable ID,
- name/aliases,
- category/family,
- accepted input constraints,
- renderer mapping,
- print options,
- human-readable-text behavior,
- known decoder compatibility,
- docs/warnings for domain-specific formats.

## UI PRs

Include screenshots for:

- desktop,
- tablet/narrow desktop,
- mobile,
- dark mode if changed.

Keyboard/focus behavior is part of review.

## Dependencies

Explain why a new dependency is necessary and why Web Platform/existing dependencies are insufficient. Heavy packages should be dynamically imported.

## License

MIT is a strong default, but the repository owner should enter the correct legal copyright holder rather than automation guessing it.
