# 10 — Privacy & Security

## Privacy is architecture

Default:

```text
input
→ browser memory
→ local renderer
→ local preview
→ local download
```

No payload server round-trip required.

## Recommended privacy claim

Only after implementation verifies it:

> “Your codes are generated in your browser. Qraft does not need to upload your payload, logo, CSV or scan image to create a code.”

Do not use this claim if future telemetry sends raw values.

## Sensitive payloads

Treat as sensitive:

- Wi‑Fi passwords,
- vCard/contact data,
- OTP secrets,
- payments,
- event details,
- batch records,
- scanned contents.

Rules:

- no production console logging,
- no analytics fields,
- no auto local persistence,
- no share-by-URL by default.

## Image/logo upload

- allow-listed image types,
- file-size and dimension limits,
- local decoding,
- safe SVG path,
- revoke object URLs.

### SVG risk

SVG may include script, events, external resources.

Do not inject uploaded SVG with raw `innerHTML`.

Safer:

1. sanitize strongly,
2. rasterize user SVG,
3. strict element/attribute allow-list.

## `.qraft.json`

Threats:

- huge files,
- malicious object shapes,
- unknown schema,
- giant data URIs.

Mitigations:

- file-size cap,
- parse + schema into fresh domain objects,
- no unsafe deep merge,
- embedded asset limits,
- migration/version checks.

## CSV

- data only,
- never execute formulas,
- row/file cap,
- protect generated CSV reports from formula injection.

## Scanned URL

Never auto-open.

Show:

- normalized host,
- raw URL,
- explicit Open button,
- unusual-scheme warning.

Qraft is not malware scanning; valid syntax ≠ safe destination.

## Camera privacy

- permission after click only,
- visible active state,
- stop tracks on close/unmount,
- no frame upload,
- upload fallback.

## CSP

Design after the real bundle is known.

Aim to restrict:

- scripts,
- connections,
- frames,
- objects.

Allow only required blob/data sources for local images/workers/export.

## Analytics

Best v1: none.

If later:

- privacy-friendly,
- no payload,
- no filename,
- no scan result,
- no QR destination.

## Dependency risk

Encoders/decoders process untrusted input. Keep them patched.

CI:

- dependency review,
- audit as a signal,
- framework advisories,
- automated update PRs.

## Vercel headers

Evaluate/test:

- CSP,
- HSTS once domain stable,
- `X-Content-Type-Options`,
- `Referrer-Policy`,
- `Permissions-Policy`,
- frame protections.
