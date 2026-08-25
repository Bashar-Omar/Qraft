# Security Policy

## Supported versions

Until v1.0, only current `main` is supported. After v1, list supported release lines explicitly.

## Reporting

Do not publish exploit details in a public issue before a fix. Use GitHub private vulnerability reporting/security advisories if enabled.

## Security model

Qraft minimizes server attack surface:

- generation is client-side,
- user images/logos are local by default,
- no required account/database,
- CSV/project files are untrusted,
- exported SVG must not preserve unsafe script/event content from user assets,
- camera permission occurs only after explicit user action,
- camera tracks stop when scanning closes,
- user payloads never become analytics properties.

## Dependency security

- lockfile required,
- automated dependency review,
- prompt framework security updates,
- do not preserve known-vulnerable versions only to avoid lockfile changes.

## Headers

Evaluate and test:

- Content-Security-Policy,
- `X-Content-Type-Options: nosniff`,
- `Referrer-Policy`,
- `Permissions-Policy`,
- frame-ancestor protection.

CSP must match the final worker/blob/image behavior; do not copy a template blindly.
