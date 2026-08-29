# Phase 3C Step 3 — Inspector action hardening

## Goal

Close the Phase 3 payload-breadth cycle by turning the existing local inspector seam into a reusable, explicit action model for future Scanner results without making decoded content executable by default.

This step does not add camera/image decoding. It hardens the application/UI boundary that Phase 5 can reuse.

## Classification provenance

Every inspection result records one deterministic basis:

- **Known intent** — the caller already knows the selected Qraft payload type and that codec accepts the value,
- **Signature** — generic inspection recognizes a bounded structured signature/host before broader fallbacks,
- **Text fallback** — no curated structured signature matched and the raw value is kept as Text.

Qraft deliberately avoids pseudo-probability scores. The inspector reports how classification happened rather than inventing confidence percentages.

## Destination metadata

URI-like values may expose local-only metadata:

- scheme,
- normalized HTTP(S) host where present,
- open policy: explicit web navigation or copy-only.

No DNS lookup, HEAD request, redirect resolution, reputation API or association-file fetch is performed.

## Explicit Open policy

Only credential-free `http:` and `https:` payload strings get an Open action. HTTP(S) URLs containing embedded username/password data remain visible for inspection but are copy-only.

The action:

- is never invoked automatically,
- uses a normal anchor rather than `window.open()` orchestration,
- opens a separate browsing context,
- includes `rel="noopener noreferrer"`,
- includes `referrerpolicy="no-referrer"`.

Custom app schemes and other non-web schemes remain copy-only. Their syntax can be inspected, but Qraft does not attempt to execute or dispatch them.

## Notices

The inspector surfaces bounded notices for action-relevant cases:

- HTTP is unencrypted in transit,
- non-web schemes are copy-only,
- custom App schemes are not verified and may collide or resolve differently across devices,
- HTTPS App links are syntactically validated but Qraft does not verify Apple/Android app↔website association.

The footer also states the product boundary: valid syntax does not prove destination safety.

## Architecture

```text
decoded/generated payload
        ↓
inspectPayload application use case
        ↓
codec inspection + precedence
        ↓
classification basis
+ local URI metadata
+ bounded notices
        ↓
PayloadInspector UI
        ↓
Copy always
Open only for HTTP(S), explicit click
```

Navigation policy remains in the application/presentation seam. Payload codecs still own syntax, renderer/export/quality code remains unchanged, and vendor types do not enter core/UI contracts.

## Tests

Step 3 adds coverage for:

- preferred/signature/fallback provenance,
- HTTPS destination metadata,
- HTTP transport-risk notice,
- custom/non-web copy-only behavior,
- App association/custom-scheme notices,
- external anchor `href`, `_blank`, `noopener noreferrer` and `no-referrer` attributes,
- desktop/mobile Generate flows for URL, App Link and Social Link,
- updated Phase 3C landing status.

## Deferred to Phase 5

- camera permission/session lifecycle,
- image upload decoding,
- native `BarcodeDetector` fast path,
- ZXing scanner fallback,
- create-from-scan orchestration,
- physical iOS/Android scanner verification.
