# 15 — GitHub & CI/CD

## Repository baseline

Phase 0 establishes the first public engineering baseline before feature work begins. From Phase 1 onward, changes should land through focused branches, pull requests, and green CI.

## Suggested repository root

```text
Qraft/
  .github/
  docs/
  public/
  src/
  tests/
  AGENTS.md
  CONTRIBUTING.md
  SECURITY.md
  README.md
  package.json
  pnpm-lock.yaml
  next.config.ts
  tsconfig.json
  eslint.config.*
```

## Branch strategy

Keep it simple:

- protected `main`,
- feature/fix branches,
- PR merge.

Avoid GitFlow.

Examples:

- `feat/generator-shell`
- `feat/wifi-codec`
- `fix/svg-export`
- `refactor/renderer-port`

## Required PR checks

- frozen install,
- lint,
- typecheck,
- unit/contract tests,
- production build,
- Playwright smoke.

Optional:

- dependency review,
- CodeQL,
- Lighthouse.

## CI outline

```text
quality:
  checkout
  setup node
  setup pnpm
  pnpm install --frozen-lockfile
  pnpm lint
  pnpm typecheck
  pnpm test

build:
  pnpm build

e2e:
  install browser
  pnpm test:e2e
```

## Dependency automation

Use Dependabot **or** Renovate, not both.

Configure:

- npm,
- GitHub Actions,
- grouped safe patches/minors,
- manual review of renderer/decoder/framework changes.

## Releases

SemVer.

Before v1:

- `0.x` releases,
- schema changes require migrations.

After v1:

- project-file compatibility becomes a user promise.

Tags:

- `v0.1.0`
- `v0.5.0`
- `v1.0.0`

## Final public README

Include:

1. hero/logo,
2. one-line proposition,
3. live demo,
4. screenshots,
5. feature summary,
6. privacy statement,
7. stack,
8. development setup,
9. architecture diagram,
10. tests,
11. supported-format approach,
12. roadmap,
13. contributing,
14. license.

## GitHub topics

Suggested when features actually ship:

- qr-code
- barcode
- qr-generator
- barcode-generator
- nextjs
- typescript
- react
- open-source
- privacy
- gs1

Do not tag PWA/GS1 until real support is present.

## Public credibility

Use:

- meaningful issue labels,
- ADRs,
- real test badges,
- screenshots,
- releases.

Avoid:

- fake user numbers,
- empty enterprise boilerplate,
- vanity badges with no value.

## Security settings

Enable where available:

- private vulnerability reporting,
- dependency graph,
- secret scanning,
- CodeQL.

Never store Vercel secrets in repo.

## Preview deploys

Vercel preview deployments should be used for UI PR review.

PRs with UI changes include:

- desktop screenshot,
- mobile screenshot,
- preview URL,
- test notes.
