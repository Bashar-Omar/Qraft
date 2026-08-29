# Phase 3B — Step 3/3: Integration Hardening & Payload Inspector Seam

## Status

This is the third implementation step in the current three-step local development cycle. Step 1 added RFC 5545 Event. Step 2 added exact Raw mode. Step 3 hardens the shared payload contract and introduces the inspector seam that the future Scanner can reuse.

The branch is not accepted until the full repository verification gate passes on the Windows source-of-truth workspace.

## Goal

Phase 3B should finish with Event and Raw behaving like first-class payloads rather than isolated editor additions.

The final encoded string is now inspected through a reusable application use case:

```text
encoded payload
  ↓
application/inspect
  ↓
preferred known type OR signature detection
  ↓
registered PayloadCodec.inspect()
  ↓
Qraft-owned metrics + primitive field rows
  ↓
Generate inspector today / Scanner result UI later
```

No codec draws UI. No UI reimplements payload parsing.

## Detection precedence

Some codecs are intentionally broad. Text accepts any non-empty text; Raw accepts any non-empty exact payload; the curated URL codec can normalize a missing scheme when used as an editor.

Generic inspection therefore uses conservative signatures:

1. Event `BEGIN:VCALENDAR`
2. vCard `BEGIN:VCARD`
3. Wi-Fi `WIFI:`
4. Email `mailto:`
5. Phone `tel:`
6. SMS `sms:`
7. Location `geo:`
8. WhatsApp `https://wa.me/...`
9. explicit HTTP(S) URL
10. Text fallback

When Generate already knows the selected payload type, it passes that type as the preferred inspector so Raw/Text identity is preserved exactly.

Raw is deliberately **not** auto-detected in generic mode because doing so would classify every non-empty scan as Raw and make semantic detection impossible.

## Metrics

UTF-8 bytes, Unicode code points, line breaks and non-whitespace control-character counts now come from a shared core utility instead of Raw-specific implementation code.

This lets Raw capacity feedback and the inspector agree on byte accounting while keeping measurement independent from React and renderer packages.

## UI behavior

The Generate preview column now shows a local Payload Inspector after Quality:

- detected/known payload type,
- UTF-8 bytes,
- Unicode code points,
- line count,
- primitive parsed fields,
- collapsible raw encoded payload,
- optional user-initiated Copy action.

The raw value is rendered as React text, not injected HTML/SVG. There is no auto-open action.

## Security boundary

The inspector is descriptive only.

It does not:

- fetch URLs,
- auto-open destinations,
- execute payload content,
- inject HTML/SVG,
- mutate the payload,
- persist inspected values,
- log sensitive values.

Clipboard failure is non-fatal because browser security/context rules can deny the API.

## Scanner seam

Phase 5 can reuse `createPayloadInspector()` with decoded raw strings. Camera/image decoding, URL confirmation UI and create-from-scan remain outside Phase 3B.

This avoids coupling the future Scanner to codec internals or duplicating Wi-Fi/vCard/Event parsing.

## Step 3 gate

Automated coverage adds:

- structured signature-detection precedence,
- WhatsApp-before-URL classification,
- explicit-scheme requirement for generic URL detection,
- preferred Raw exactness,
- every registered sample encode → inspect contract,
- shared UTF-8 metric tests,
- desktop/mobile Generate inspector E2E for Event + Raw,
- confirmation that inspection does not navigate away from Generate.

The final three-step Phase 3B gate must run formatting, lint, strict TypeScript, all Vitest tests, production build and Playwright desktop/mobile smoke before commit/push.
