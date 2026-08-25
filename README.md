# Qraft

**Craft codes that work.**

Qraft is a public-source, privacy-first QR and barcode studio being built as a portfolio-grade product: designer-friendly, standards-aware, responsive, testable and local-first.

> **Current status:** Phase 0 — repository foundation.  
> The application shell, brand system, theme, static-export configuration, tests and CI are implemented. The local Phase 0 quality gate is green; GitHub CI is the remaining external reproduction check. QR generation itself starts in Phase 1; this repository does not fake unfinished functionality.

## Product principles

- Browser-first generation and file handling.
- No required account, database or cloud history in v1.
- Payload semantics are separate from visual symbologies.
- QR/barcode engines live behind ports/adapters.
- Common formats are curated; long-tail formats belong in Expert Mode.
- Quality guidance is transparent and never presented as certification.
- Responsive/mobile behavior is part of “done,” not a later patch.

## Phase 0 stack

- Next.js `16.3.3`
- React `19.2.8`
- TypeScript `5.9.3` deliberately pinned for current Next.js build compatibility
- Tailwind CSS `4.3.3`
- pnpm `11.23.0`
- Vitest `4.1.11`
- Playwright `1.62.1`
- ESLint 9 + `eslint-config-next`
- Prettier `3.9.6`

Node.js `24 LTS` is the project/CI standard. Next.js requires at least Node `20.9`, and pnpm 11 supports Node 24.

## Why TypeScript 5.9 instead of TypeScript 7?

TypeScript 7 is the current npm `latest`, but current Next.js 16 tooling still expects the legacy JavaScript compiler API entrypoint that TypeScript 7 no longer ships. Qraft prioritizes a reproducible production build over chasing a major version before the framework integration is ready.

This decision is isolated in `package.json` and documented in `docs/21-PHASE-0-IMPLEMENTATION.md`.

## pnpm supply-chain policy

Qraft keeps pnpm 11's strict dependency-build protection enabled. Dependency install scripts
must be explicitly reviewed in `pnpm-workspace.yaml`; currently only `unrs-resolver` is allowed.
Verification is configured not to auto-install stale dependencies.

## Local setup — Windows

The intended workspace is:

```text
D:\Port\Qraft
```

From PowerShell:

```powershell
cd D:\Port\Qraft
.\scripts\bootstrap.ps1
.\scripts\verify.ps1
pnpm dev
```

Then open `http://localhost:3000`.

`bootstrap.ps1` validates Node 24, ensures pnpm 11.23.0 is available for the current Windows user, installs dependencies, and validates that `pnpm-lock.yaml` exists. GitHub CI always installs with `--frozen-lockfile`.

## Main commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm format:check
pnpm verify
```

## Architecture

```text
UI / features
    ↓
application use-cases
    ↓
ports / Qraft-owned domain types
    ↓
adapters / rendering & decoding libraries
```

The planned source architecture is documented in `docs/06-ARCHITECTURE-SOLID.md`.

The runtime folders are intentionally small in Phase 0. We do not create empty architecture theater just to make the tree look large; folders appear when a real contract or feature arrives.

## Current routes

- `/` — product/foundation landing
- `/generate` — responsive Generate shell; real pipeline arrives in Phase 1
- `/scan` — planned scanner surface
- `/batch` — planned batch surface
- `/guides` — guide/documentation surface

## Repository quality

CI checks:

1. formatting,
2. ESLint,
3. TypeScript,
4. Vitest,
5. production static build,
6. Playwright Chromium smoke tests.

See `CONTRIBUTING.md` and `docs/15-GITHUB-CI-CD.md` for the repository workflow and CI policy.

## Roadmap

The full roadmap is under `docs/13-ROADMAP.md`.

Immediate next work after Phase 0 is green:

1. payload registry and codec contracts,
2. URL/Text payloads,
3. safe standard QR renderer,
4. live preview,
5. SVG/PNG export,
6. render→decode golden vector.

## Privacy

Normal Qraft generation is designed to happen in the browser. User QR payloads, logos, scans and CSVs must not become analytics properties or production logs.

## License

A public-source license has **not** been chosen yet. The package is marked `UNLICENSED` intentionally until the repository owner explicitly selects the final license. The blueprint recommends making that decision before public v1.
