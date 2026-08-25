# 16 — Vercel Deployment

## Goal

Core Qraft should have almost no backend runtime cost because generation is local.

## Preferred models

### A — Static export

Best privacy/portability if all routes remain compatible.

Pros:

- CDN static assets,
- host agnostic,
- easy self-host/fork,
- minimal runtime cost.

### B — Normal Vercel Next.js

Acceptable if landing/docs benefit from runtime framework behavior.

Core generation remains client-side either way.

Record the final choice after scaffold validation.

## Connect repository

After code exists:

1. Import `Bashar-Omar/Qraft` into Vercel.
2. Framework: Next.js.
3. package manager from lockfile.
4. configure production domain.
5. keep preview deployments.

No database required.

## Environment variables

v1 should require almost none.

Possible later:

- canonical site URL,
- optional privacy analytics ID if intentionally enabled.

User QR payloads never belong in env.

## Headers

Test:

- CSP,
- camera `Permissions-Policy`,
- `Referrer-Policy`,
- `X-Content-Type-Options`,
- frame policy.

Account for legitimate:

- `blob:` previews,
- data/blob image sources,
- web workers,
- local export.

Do not freeze CSP before real bundle behavior is known.

## Caching

- immutable hashed static assets,
- normal page/CDN caching,
- no generated-code server cache because codes are local.

## Domain

Portfolio options:

- `qraft.<owner-domain>`
- dedicated Qraft domain later.

Keep Vercel preview URLs functional for review.

## Analytics

Do not enable by reflex.

If enabled later:

- document it,
- never include payload destinations, scan results or filenames in events.

## Build safeguards

Deployment should only proceed after GitHub quality gates pass.

“Vercel built” is not equivalent to “quality checked.”

## Framework security

Before public deploy:

- check current Next.js security advisories,
- update patched stable/LTS,
- refresh lockfile deliberately,
- rerun tests.

This is particularly important for this plan's research date because the August 2026 Next.js security release had just been published and the project advised upgrading to patched LTS releases immediately.
