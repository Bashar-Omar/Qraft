# Phase 3C Step 1 — App Link Helper

## Goal

Add a first-class App Link intent without turning Qraft into a redirect service, a remote link verifier or a generic unsafe URI executor.

This is Step 1 of the Phase 3C three-step cycle. Step 2 adds social/profile helpers. Step 3 closes the cycle with richer-inspector integration and documentation hardening before the GitHub push.

## Product boundary

Qraft encodes exactly one destination URI into the QR payload.

Two strategies are supported:

1. **HTTPS app / universal link — recommended**
   - requires an `https://` URL with a host,
   - preserves the validated destination string,
   - is compatible with Apple Universal Links and Android App Links when the destination owner has configured the required app↔website association,
   - Qraft does **not** fetch association files and does not claim that a given domain is verified.

2. **Custom app URI scheme — advanced**
   - requires an RFC 3986-style absolute scheme,
   - preserves the exact destination after outer whitespace validation,
   - rejects executable/dangerous schemes and schemes already owned by dedicated Qraft editors,
   - carries an explicit UX warning because custom schemes can collide and do not provide the same web fallback as an HTTPS link.

There is intentionally no separate “fallback URL” field. A QR code contains one URI. Platform-backed HTTPS app links get their browser fallback from the same web URL; a custom scheme would require external redirect infrastructure to add reliable fallback behavior, which is outside Qraft v1.

## Architecture

The feature is additive:

```text
AppLinkEditor
→ appLinkCodec
→ payloadRegistry
→ existing generate/render/quality/export pipeline
→ existing payload inspector (preferred payload id)
→ .qraft.json schema v1
```

No renderer, exporter or quality-rule branch is added.

Generic scanner-style inspection also stays conservative:

- an HTTPS App Link still auto-classifies as ordinary `URL` when Qraft does not already know the user's intent,
- an unknown custom scheme stays inert `Text`,
- the generator can label either form `App Link` because it passes the known `PayloadId`,
- no payload is automatically opened.

## Validation

HTTPS strategy:

- non-empty,
- maximum 2,048 characters,
- no raw spaces/control characters,
- HTTPS only,
- host required,
- embedded URL credentials rejected.

Custom-scheme strategy:

- non-empty,
- maximum 2,048 characters,
- no raw spaces/control characters,
- scheme follows `ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )`,
- content must exist after `:`,
- web/dedicated/executable schemes are rejected in this curated helper.

Raw mode remains the explicit power-user escape hatch for data outside the curated policy.

## Primary research

### Apple Universal Links

Apple documents Universal Links as ordinary HTTP/HTTPS URLs with an app↔website association. When the app is unavailable, the same URL can open in the browser. Association is established by the destination website/app configuration, not by the QR generator.

- `https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content`
- `https://developer.apple.com/documentation/xcode/supporting-associated-domains`

### Android App Links

Android documents App Links as HTTP/HTTPS deep links verified against website Digital Asset Links configuration.

- `https://developer.android.com/training/app-links/about`
- `https://developer.android.com/training/app-links/add-applinks`

### URI syntax

RFC 3986 defines the generic URI scheme grammar while leaving scheme-specific semantics to each scheme.

- `https://www.rfc-editor.org/rfc/rfc3986.html`

## Tests

- codec unit coverage for HTTPS/custom forms and unsafe inputs,
- registry order/update coverage,
- portable-project round trip,
- QR golden render/decode vector,
- inspector precedence: known App Link vs generic URL/Text,
- Playwright desktop/mobile flow including self-test and project export.

## Deferred

- provider/social templates: Step 2,
- richer safe actions / inspector polish: Step 3,
- network verification of association files: not part of this local-first helper,
- hosted redirect/fallback service: outside Qraft v1.
