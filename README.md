# Qraft

**Craft codes that work.**

Qraft is a public-source, privacy-first QR and barcode studio being built as a portfolio-grade product: designer-friendly, standards-aware, responsive, testable and local-first.

> **Current status:** Phase 2D — Export + portable projects.
> Phase 2 Visual Studio is now feature-complete against its planned gate: styled/local-logo QR, Quality Assistant v1, SVG/PNG/JPEG/WebP export and versioned `.qraft.json` import/export are integrated and covered by browser round-trip tests.

## Product principles

- Browser-first generation and file handling.
- No required account, database or cloud history in v1.
- Payload semantics are separate from visual symbologies.
- QR/barcode engines live behind ports/adapters.
- Common formats are curated; long-tail formats belong in Expert Mode.
- Quality guidance is transparent and never presented as certification.
- Responsive/mobile behavior is part of “done,” not a later patch.

## Current stack

- Next.js `16.3.3`
- React `19.2.8`
- TypeScript `5.9.3` deliberately pinned for current Next.js build compatibility
- Tailwind CSS `4.3.3`
- pnpm `11.23.0`
- Vitest `4.1.11`
- Playwright `1.62.1`
- ESLint 9 + `eslint-config-next`
- Prettier `3.9.6`
- `qr` `0.6.0` behind Qraft's standard QR renderer adapter
- `qr-code-styling` `1.9.2` behind the browser-only designer QR adapter
- `@zxing/library` `0.23.0` behind the lazy local QR self-test adapter

Node.js `24 LTS` is the project/CI standard.

## Why the QR engines are isolated

`qr@0.6.0` remains the standards-first structural baseline and golden-vector oracle. Phase 2A adds `qr-code-styling@1.9.2` only behind `src/engines/render/designer-qr/`, loaded dynamically in the browser. Phase 2B adds `@zxing/library@0.23.0` only behind `src/engines/decode/zxing/` for explicit artifact self-tests. Qraft design and quality contracts remain vendor-neutral.

See `docs/18-ADR-DECISIONS.md`, `docs/22-PHASE-1-CORE-QR.md`, `docs/23-PHASE-2-VISUAL-STUDIO.md`, `docs/24-PHASE-2B-QUALITY-ASSISTANT.md`, `docs/25-PHASE-2C-LOGO-SAFETY.md` and `docs/26-PHASE-2D-EXPORT-PROJECT.md`.

## Why TypeScript 5.9?

Qraft prioritizes a reproducible framework build over automatic major upgrades. The TypeScript pin is isolated in `package.json`; upgrades are reviewed as deliberate maintenance work rather than merged from Dependabot by default.

## pnpm supply-chain policy

Qraft keeps pnpm 11's strict dependency-build protection enabled. Dependency install scripts must be explicitly reviewed in `pnpm-workspace.yaml`; currently only `unrs-resolver` is allowed. Verification is configured not to auto-install stale dependencies.

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
Payload codec / registry
        ↓
application use-case
        ↓
Qraft rendering port
        ↓
    QR router
   ↙        ↘
default      styled design
   ↓             ↓
standard      designer adapter
renderer       ↙        ↘
   ↓      standard      lazy styling
canonical    oracle        engine
SVG +       ↓                ↓
matrix   verification   canonical SVG
             matrix          ↓
                 ↘      preview / export
                              ↓
                    SVG / PNG / JPEG / WebP
```

Vendor package types stay inside `engines/`. The architecture contract is documented in `docs/06-ARCHITECTURE-SOLID.md`.

## Current routes

- `/` — product landing and current capability status
- `/generate` — live Core QR studio for URL, Wi-Fi, Email, Phone, SMS and Text
- `/scan` — planned scanner surface
- `/batch` — planned batch surface
- `/guides` — guide/documentation surface

## Phase 1 capability

Implemented across Phase 1A + 1B:

1. typed payload contracts and registry,
2. URL codec with local validation and `https://` normalization,
3. exact plain-text codec,
4. Email `mailto:` codec with recipients, subject and body,
5. standards-oriented `tel:` Phone codec,
6. `sms:` codec with recipient and message body,
7. Wi-Fi codec with WPA/WPA2, WEP, open-network and hidden-network handling,
8. Wi-Fi reserved-character escaping and 32-byte SSID validation,
9. safe standard QR adapter,
10. ECC L/M/Q/H with Medium as the default,
11. fixed four-module quiet-zone baseline,
12. live local preview,
13. Qraft-owned SVG export,
14. crisp browser-canvas PNG export,
15. codec/registry/render golden coverage plus desktop/mobile Playwright flows.

The current same-engine render→decode tests are software regression checks, **not scanner certification**. Physical-device and independent-decoder validation remain release-hardening work.

## Repository quality

Protected `main` requires pull requests and CI. The CI gate checks formatting, ESLint, TypeScript, Vitest, production static build, and Playwright coverage in desktop and mobile Chromium profiles.

See `CONTRIBUTING.md` and `docs/15-GITHUB-CI-CD.md` for workflow policy.

## Current Visual Studio capability

Phase 2A adds:

1. Qraft-owned design schema,
2. Pure Mono / Qraft Mint / Soft Mint / Packaging presets,
3. solid and linear-gradient foregrounds,
4. solid or transparent backgrounds,
5. module and eye shapes,
6. default-design fast path on the standard renderer,
7. lazy browser-only designer rendering,
8. styled SVG and PNG artifacts.

Phase 2B adds:

1. a Qraft-owned QR quality context, findings and rule seam,
2. four-module quiet-zone validation,
3. luminance-based contrast guidance with multi-point gradient sampling,
4. inversion/transparency warnings,
5. ECC + styling guidance,
6. version/module/density metadata,
7. explicit local self-test of the canonical SVG with an independent ZXing decoder,
8. Good / Check / Risk presentation without certification claims.

Phase 2C adds:

1. local PNG/JPEG/WebP logo upload with real-signature and dimension preflight,
2. a 4 MiB / 4096px / 16-megapixel source boundary,
3. local decode and re-encode to a bounded square PNG that preserves source aspect ratio,
4. object-URL lifecycle cleanup with no File/Blob persistence in the domain model,
5. Qraft-owned logo size/padding geometry separate from runtime image bytes,
6. designer-adapter logo embedding with a self-contained canonical SVG,
7. explainable center-occlusion and ECC guidance,
8. conservative one-click logo settings plus final-artifact local self-test.

Phase 2D adds:

1. shared canonical-SVG rasterization behind exporter adapters,
2. curated 512 / 1024 / 2048 / 4096 raster targets with integer module alignment,
3. real JPEG export with a solid white backing surface,
4. WebP export with exact MIME verification rather than silent PNG fallback,
5. versioned `.qraft.json` schema v1,
6. bounded project/logo file sizes and strict fresh-object parsing,
7. schema migration infrastructure and graceful future-version rejection,
8. optional bounded embedded normalized PNG logo for true local project portability,
9. project import validation through the current payload codecs,
10. desktop/mobile E2E coverage for raster artifacts and project save/restore.

Next: Phase 3 payload breadth — vCard, WhatsApp, Location, Event and Raw mode.

## Privacy

Normal Qraft generation is designed to happen in the browser. User QR payloads, logos, scans and CSVs must not become analytics properties or production logs. URL generation validates syntax locally and does not fetch the destination.

## License

A public-source license has **not** been chosen yet. The package is marked `UNLICENSED` intentionally until the repository owner explicitly selects the final license. The blueprint recommends making that decision before public v1.
