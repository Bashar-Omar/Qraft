# 18 — Architecture Decision Records

## ADR-001 — Client-side-first generation

**Status:** Accepted

Qraft generation, user assets, scan uploads, CSV and normal exports run in the browser.

Why:

- privacy,
- cost,
- speed,
- self-hosting,
- offline potential.

Trade-off:

- browser resource limits,
- no first-party dynamic redirect.

---

## ADR-002 — No first-party dynamic QR in v1

**Status:** Accepted

Editable-after-print codes require a stable redirect URL + persistent destination state.

Qraft v1 does not fake dynamic QR.

Future option:

- BYO redirect provider,
- separate cloud service boundary.

---

## ADR-003 — Specialized rendering engines

**Status:** Accepted / refined in ADR-013

- standards-first QR adapter for the safe baseline,
- styled QR adapter for creative normal QR,
- bwip adapter for industrial/barcode breadth.

Reason:
standard QR correctness, creative styling breadth and barcode breadth are different optimization problems. Each engine remains replaceable behind Qraft-owned ports.

---

## ADR-004 — Vendor libraries behind ports

**Status:** Accepted

No encoder/decoder package types outside `engines/`.

Protects:

- domain,
- UI,
- project schema,
- testability.

---

## ADR-005 — Native scanner + ZXing fallback

**Status:** Accepted

`BarcodeDetector` is feature-detected. ZXing provides compatibility.

---

## ADR-006 — Progressive symbology catalog

**Status:** Accepted

Use:

- Curated,
- Expert,
- Experimental.

Never dump 100+ choices into primary UX.

---

## ADR-007 — Portable projects instead of accounts

**Status:** Accepted

Versioned `.qraft.json` is the default persistence/share artifact.

Requires migration discipline.

---

## ADR-008 — Qraft owns design model

**Status:** Accepted

Saved styles use Qraft domain names, not `qr-code-styling` option objects.

This keeps saved projects stable across renderer replacement/upgrades.

---

## ADR-009 — Prefer static export, validate before locking

**Status:** Proposed/validate

Attempt a fully static Next.js app. If a justified feature needs server runtime, document it.

---

## ADR-010 — Geist initially

**Status:** Accepted

Reference uses General Sans + Geist Mono.

Initial public implementation:

- Geist Sans,
- Geist Mono.

Add General Sans only after license/distribution confirmation.

---

## ADR-011 — No generic pre-styled design kit

**Status:** Accepted

Radix may provide accessible primitives. Qraft provides all visual styling.

Goal:
avoid generic AI/shadcn clone appearance.

---

## ADR-012 — Quality findings, not certification

**Status:** Accepted

Quality Assistant exposes transparent checks + local self-decode.

No certification language without an actual certification process.

---

## ADR-013 — Prove a standard QR baseline before designer styling

**Status:** Accepted

Phase 1 uses `qr@0.6.0` behind `StandardQrRenderer` for the first production QR path.

Reasons:

- zero runtime dependencies,
- built-in TypeScript declarations,
- browser and Node support,
- raw matrix output that Qraft can own and export itself,
- QR versions 1–40 and all four standard error-correction levels,
- decoding support suitable for software regression vectors,
- recent 0.6.0 security/spec self-audit and TypeScript 5.9+ compatibility work.

Boundary:

- `qr` imports are allowed only inside `src/engines/` and engine-focused tests,
- UI/application/domain code consumes Qraft-owned types,
- Qraft generates its own SVG/PNG artifacts from the normalized matrix,
- designer QR styling is a separate future adapter and does not redefine the safe standard baseline.

Testing caveat:

A render→decode round trip using the same library is a useful regression gate, not independent scanner certification. Later hardening must add independent decoder/device fixtures.

---

## ADR-014 — Canonical styled SVG with a separate verification matrix

**Status:** Accepted

Phase 2 uses `qr-code-styling@1.9.2` behind a browser-only adapter for creative QR rendering. The dependency is dynamically imported only inside the adapter because eager imports have historically caused `window`/`self` failures in Next.js server execution.

Qraft continues to run `StandardQrRenderer` as a structural oracle for payload/version/ECC/quiet-zone metadata and software golden vectors. A designer engine can legally choose a different QR mask, so its visible artifact must not be reconstructed from the standard engine's matrix.

Therefore:

- `RenderedCode.svg` is the canonical visible/export artifact,
- `RenderedCode.verificationMatrix` is the standards-oriented reference,
- PNG is rasterized from the canonical SVG,
- the default Pure Mono design remains on the lightweight standard renderer,
- styled requests are routed to the designer adapter without UI vendor conditionals,
- designer runtime imports are browser-only and lazy,
- vendor option types never enter Qraft design state,
- gradient degrees are converted to vendor radians only in the adapter,
- logo support waits for Quality Assistant guardrails.

---

## ADR-015 — Independent local artifact self-test behind a decoder port

**Status:** Accepted

Phase 2B validates the exact canonical QR SVG with an independent decoder rather than treating the encoder's own round-trip tests as sufficient evidence.

Decision:

- deterministic quality heuristics remain pure Qraft domain logic,
- the user explicitly runs artifact self-test rather than paying decoder cost on every keystroke,
- the canonical SVG is rasterized locally at a bounded representative size,
- transparent art is tested on a documented white representative surface,
- decoded raw data must exactly equal the generated raw payload,
- the result exposes only pass/failure reason, not the payload,
- `@zxing/library@0.23.0` is isolated behind `QrArtifactDecoder` and dynamically imported in the browser,
- a self-test failure elevates the visible Quality Assistant summary to Risk,
- the UI never calls a synthetic pass "certified" or "guaranteed".

Why use the narrow library package now:

Phase 2B needs QR image-decoder primitives, not camera/session helpers. The later Scanner phase can evaluate `@zxing/browser` separately. This avoids coupling today's self-test to tomorrow's camera UI.

Risk:

The ZXing JS library is in maintenance mode. The adapter boundary is therefore mandatory and keeps a future replacement local to `engines/decode/`.

---

## ADR-016 — Rasterize local logo input and separate portable geometry from runtime asset

**Status:** Accepted

Phase 2C accepts PNG/JPEG/WebP logos locally, verifies real raster signatures and bounded dimensions, decodes them in the browser and re-encodes them onto an aspect-preserving square PNG canvas before rendering.

Decision:

- raw SVG logo upload is rejected in this slice rather than injected/sanitized incompletely,
- the portable design model stores only logo size/padding geometry,
- runtime image bytes are represented only by a short-lived object URL at the render boundary,
- object URLs are revoked on replacement/removal/unmount,
- rectangular source art is fitted into a square transparent PNG to avoid renderer aspect-ratio distortion,
- the designer adapter alone maps Qraft logo geometry to vendor image settings,
- logo-bearing SVG must embed the normalized PNG and may not leave a blob/external reference,
- Quality Assistant estimates logo occlusion separately from vendor calculations,
- independent self-test runs on the exact final logo-bearing canonical SVG.

Why:

This preserves privacy, avoids serializing browser/vendor state, keeps `.qraft.json` design data migration-friendly and makes the renderer replaceable without redefining saved logo controls.

---

## ADR-017 — Shared canonical raster pipeline with exact MIME verification

**Status:** Accepted

PNG, JPEG and WebP exporters rasterize `RenderedCode.svg` through one browser adapter. Raster-size policy is Qraft-owned core data; Canvas details remain in `engines/`.

Decision:

- preserve integer pixels-per-module,
- PNG/WebP may preserve alpha,
- JPEG always paints a solid white base,
- request lossy encoders at quality 0.92,
- verify the returned Blob MIME exactly,
- fail clearly if the browser silently falls back to another format.

This prevents extension/MIME mismatches and keeps all raster formats faithful to the same canonical styled artifact.

---

## ADR-018 — `.qraft.json` v1 is explicit, versioned and rebuilt into fresh domain objects

**Status:** Accepted

`.qraft.json` becomes Qraft's account-free persistence artifact.

Decision:

- schema v1 stores Qraft payload input, QR/ECC/design and export-size settings,
- project import has a file-size cap, JSON depth/node limits and strict supported keys,
- prototype-sensitive payload keys are rejected,
- migration is explicit `n → n+1`; newer versions fail instead of being guessed,
- imported payload data is checked again by the current payload codec,
- no unsafe deep merge,
- optional normalized PNG logo data is bounded and re-inspected on import,
- runtime Blob/object URL values never enter the core project schema.

This keeps saved projects stable across renderer replacements while preserving the privacy-first local workflow.

---

## ADR-019 — Standards-backed structured payloads before Event/Raw expansion

**Status:** Accepted

Phase 3 begins with vCard 4.0, WhatsApp Click to Chat and RFC 5870 `geo:` URIs.

Decision:

- use the current IETF vCard format for the curated Contact encoder,
- use WhatsApp's documented HTTPS `wa.me` link rather than a custom URL scheme,
- use provider-neutral RFC 5870 `geo:` rather than hard-coding Google/Apple Maps,
- keep all three behind the existing `PayloadCodec` and editor registries,
- defer Event to Phase 3B so RFC 5545 UID/DTSTAMP/time-zone determinism is designed explicitly,
- defer Raw mode until the curated structured payload boundary remains proven.

Why:

The three payloads add meaningful user breadth with minimal architectural surface and preserve the existing local/project/export pipeline unchanged.

---

## ADR-020 — Event drafts own persistent UID/DTSTAMP and named TZID waits for VTIMEZONE

**Status:** Accepted

Phase 3B step 1 models iCalendar Event as a normal Qraft payload while keeping RFC 5545 identity and time semantics explicit.

Decision:

- new Event drafts receive a fresh `urn:uuid:` UID and UTC DTSTAMP through an optional payload-initializer seam,
- existing payloads keep static sample initialization,
- Event edits refresh DTSTAMP while UID remains persistent,
- all-day editor end dates are inclusive for humans and converted to RFC 5545 non-inclusive `DTEND`,
- timed events support either floating local DATE-TIME or UTC DATE-TIME,
- no bare named `TZID` is emitted because RFC 5545 requires a matching `VTIMEZONE` component,
- Event remains behind `PayloadCodec` so renderer/export/quality/project code stays unchanged.

Why:

Generating random identity or current timestamps inside `encode()` would make identical draft renders unstable. Storing identity/revision metadata in the draft keeps the codec deterministic for a given state and makes `.qraft.json` a faithful portable representation. Deferring named time zones is more standards-honest than emitting an incomplete TZID reference.

---

## ADR-021 — Raw mode preserves exact payload data and exposes Qraft-owned byte capacity

**Status:** Accepted

Phase 3B step 2 adds Raw as a power-user payload rather than an unsafe renderer-configuration escape hatch.

Decision:

- Raw input is data only and is returned by the codec exactly as entered,
- whitespace is not trimmed and line endings are not rewritten,
- only the empty string is rejected as missing content,
- UTF-8 byte metrics use the Web Platform `TextEncoder`,
- current QR byte-mode Version 40 capacities are Qraft-owned core policy,
- the editor receives current ECC through a small render-context prop and labels capacity pressure descriptively,
- Raw project input remains ordinary validated JSON,
- arbitrary JavaScript, HTML/SVG injection, vendor option objects and unsafe deep merge are outside Raw mode.

Why:

"Raw" should mean semantic non-interference, not bypassing architecture or security. Keeping exact payload semantics in a codec and capacity policy in core preserves the same registry/use-case/renderer boundaries as every curated payload while giving advanced users transparent byte-level feedback.

---

## ADR-022 — Payload inspection is an application seam with explicit detection precedence

**Status:** Accepted

Phase 3B step 3 adds a reusable payload-inspection use case before the Scanner phase exists.

Decision:

- final encoded payloads are inspected through registered `PayloadCodec.inspect()` contracts,
- callers that already know the payload type may provide a preferred `PayloadId`,
- generic detection uses explicit structured signatures before broader URL/Text fallbacks,
- WhatsApp detection precedes generic HTTPS URL detection,
- URL auto-detection requires an explicit `http://` or `https://` scheme,
- Raw is never auto-detected because it intentionally accepts every non-empty value,
- generic unknown non-empty payloads fall back to curated Text,
- the inspector exposes UTF-8/code-point/line metrics through Qraft-owned core utilities,
- UI rendering treats inspected values as text only and never dereferences or injects payload content,
- no destination is opened automatically.

Why:

Scanner/Inspector later needs a stable way to classify decoded strings without rebuilding codec knowledge inside camera UI. Keeping detection/orchestration in the application layer lets codecs own syntax, avoids a second serialization parser, preserves Raw exactness and prevents permissive codecs from swallowing more specific payloads.

---

## ADR-023 — App links prefer HTTPS association and never imply verification

**Status:** Accepted

Phase 3C step 1 adds App Link as a curated payload intent without adding a redirect backend or network verifier.

Decision:

- the recommended strategy accepts one HTTPS destination suitable for Apple Universal Links / Android App Links,
- Qraft validates URI syntax and host locally but does not fetch `apple-app-site-association`, `assetlinks.json` or claim the destination is platform-verified,
- the same HTTPS value is the QR payload; Qraft does not invent a separate fallback URL,
- an advanced custom-scheme strategy accepts an RFC 3986-style app-owned URI while blocking executable/dangerous schemes and schemes handled by dedicated Qraft editors,
- generic inspection does not infer App Link semantics from an HTTPS URL or unknown custom scheme; it labels App Link only when the caller already knows that payload intent,
- renderer/export/quality code remains unchanged and no destination is auto-opened.

Why:

Universal/App Link behavior depends on configuration owned by the destination website and installed app. Encoding an HTTPS URI is deterministic and local; proving the platform association would require external network state. Keeping that distinction explicit avoids false verification claims and preserves Qraft's privacy-first, static architecture.

---

## ADR-024 — Social links are direct HTTPS destinations, not hosted bio pages

**Status:** Accepted

Phase 3C step 2 adds Social Link as a curated profile/page/channel helper while preserving Qraft's static, privacy-first boundary.

Decision:

- one Social payload covers X, Instagram, TikTok, YouTube, LinkedIn and Facebook through a platform discriminator plus handle/identifier or full HTTPS URL,
- shorthand identifiers expand locally to common public profile/channel URL forms; a pasted full URL is preserved after HTTPS and host validation,
- Qraft does not fetch account metadata, verify ownership/existence/visibility or add tracking parameters,
- generic inspection may classify known social HTTPS hosts as Social before the broader URL fallback because the host itself provides a bounded semantic signal,
- WhatsApp keeps higher precedence because it already has a dedicated payload contract,
- unknown HTTPS hosts remain ordinary URL payloads, and App Link semantics still require a preferred/known payload intent rather than being inferred from HTTPS alone,
- Social remains a normal `PayloadCodec` registration so renderer/export/quality/project code stays unchanged.

Why:

The blueprint asks for social/profile helpers, not a hosted Linktree-style service. Direct HTTPS links are portable, scanner-friendly and deterministic. Keeping platform knowledge in one codec avoids React string-building branches while still giving the inspector a useful classification seam for later scanning.

---

## ADR-025 — Inspector navigation is explicit, web-only and privacy-hardened

**Status:** Accepted

Phase 3C step 3 turns the payload inspector into the reusable action boundary that later Scanner UI can consume without making decoded content executable by default.

Decision:

- inspection records how classification was reached: known/preferred intent, explicit signature detection or Text fallback,
- URI-like payloads may expose normalized scheme/host metadata without fetching the destination,
- only credential-free `http:` / `https:` payloads receive an Open action; HTTP(S) URLs with embedded credentials remain copy-only,
- custom and other non-web schemes remain copy-only even when syntactically valid,
- Open is an ordinary explicit anchor action with a new browsing context; Qraft never navigates automatically,
- external Open uses `rel="noopener noreferrer"` plus `referrerpolicy="no-referrer"`,
- HTTP destinations receive an explicit transport-risk notice,
- App HTTPS links retain the distinction between URI validity and app↔website association verification,
- custom App schemes retain an explicit unverified/collision risk notice,
- Qraft does not treat URL syntax validation as malware, ownership or destination-safety verification.

Why:

Scanner phase results are untrusted input. Establishing the action contract before camera/image decoding exists prevents future scanner components from inventing their own navigation rules. Web-only explicit opening keeps the common useful action available while avoiding automatic execution of arbitrary custom schemes and reducing referrer leakage to external destinations.

---

## ADR-026 — Generic symbology artifacts before barcode engine integration

**Status:** Accepted

Phase 4 widens Qraft's rendering boundary before adding the barcode vendor adapter.

Decision:

- Qraft owns stable symbology IDs and capability metadata; vendor encoder IDs stay inside adapters.
- `RenderRequest` and `RenderedCode` are discriminated by symbology instead of pretending every artifact has QR ECC/version/matrix fields.
- canonical SVG artifacts expose natural width/height so rectangular linear and stacked codes do not inherit a square-only export contract.
- current QR raster sizing keeps its exact integer pixels-per-module behavior.
- non-QR raster sizing preserves the canonical SVG aspect ratio and prefers integer scaling from natural dimensions.
- the existing `.qraft.json` schema remains v1 while QR is the only saveable symbology. The first barcode project-writing feature will introduce schema v2 plus an explicit v1 → v2 migration instead of silently changing v1 semantics.

Why:

- Code 128/PDF417 and similar symbols are naturally rectangular.
- BWIP exposes natural SVG `viewBox` dimensions and module-oriented scale behavior; forcing those through Qraft's historical square `pixelSize` contract would distort output.
- preserving schema v1 avoids needless project-file churn before barcode state can actually be saved.

Gate:

- Phase 4B may add a barcode adapter without changing payload codecs or QR-specific quality types.
- Phase 4C UI controls must derive from symbology capabilities instead of `if (type === ...)` styling branches.

---

## ADR-027 — BWIP is a lazy named-encoder runtime, not a core dependency

**Status:** Accepted

Phase 4B installs `@bwip-js/browser` as Qraft's broad barcode engine while deliberately exposing
only the Code 128 and Data Matrix proof slice.

Decision:

- only `src/engines/render/bwip/bwip-browser-runtime.ts` may import `@bwip-js/browser`,
- production uses only explicit named encoders plus `drawingSVG()`; Phase 4B began with `code128`/`datamatrix` and Phase 4D expands that same boundary to the curated linear/retail set,
- the concrete runtime is dynamically imported behind `LazyBwipBarcodeRenderer`,
- Qraft-owned adapter contracts remain independently testable without loading the package,
- the generic 100+ encoder catalog is not eagerly linked into the existing QR path,
- vendor SVG is validated before it becomes Qraft's canonical artifact.

Why:

The BWIP package deliberately exposes named encoders to support bundler tree-shaking. Qraft needs
its breadth later, but Phase 4 must not make every QR visit pay for the full catalog or leak BWIPP
option spelling throughout the product.

---

## ADR-028 — Data Matrix Unicode requires explicit ECI semantics

**Status:** Accepted

Phase 4B's curated Data Matrix proof encodes Latin-1 bytes only.

Decision:

- Qraft validates each current Data Matrix code point as `U+0000`–`U+00FF`,
- the adapter hands the resulting eight-bit string to BWIP with `binarytext: true`,
- arbitrary Unicode outside Latin-1 is rejected rather than silently UTF-8 encoded,
- a future Unicode workflow must explicitly choose and test ECI semantics before becoming curated,
- the current 1555-byte boundary is expressed as a byte limit, not a JavaScript character count.

Why:

A barcode can contain a valid byte sequence while a scanner still interprets those bytes with the
wrong character set. Qraft's standards promise is stronger than “the renderer accepted the string”,
so Unicode remains closed until its interpretation contract is explicit and independently tested.

---

## ADR-029 — Project schema v2 separates content from code representation

**Status:** Accepted

Phase 4C is the first feature that can persist a non-QR code, so Qraft advances portable projects to schema v2 instead of mutating the meaning of schema v1.

Decision:

- schema v2 stores a `content` union separately from a `code` union,
- QR projects use `content.kind = "payload"` plus `code.symbology = "qr"`,
- curated barcode projects use `content.kind = "barcode"` plus a validated barcode symbology/config,
- schema v1 remains readable and migrates explicitly into the v2 QR branch before v2 parsing,
- barcode projects cannot carry QR logo assets,
- capability-invalid persisted state (for example Data Matrix + HRT) is rejected,
- all imported payload/barcode content is revalidated through current Qraft domain policy.

Why:

Payload meaning and code representation are different product concepts. Keeping them separate prevents future Data Matrix/GS1/Expert work from turning project persistence into a growing QR-shaped object with optional fields. An explicit migration also preserves the portability promise made by earlier releases.

---

## ADR-030 — Retail check digits are Qraft domain state, not renderer side effects

**Status:** Accepted

Phase 4D expands the curated barcode surface into retail identifiers where a renderer can accept a
short input and calculate the final check digit implicitly.

Decision:

- Qraft calculates and verifies GTIN Mod-10 check digits before the BWIP boundary,
- validated barcode state distinguishes user input from the canonical encoded payload,
- EAN-13, EAN-8, UPC-A and ITF-14 accept the standard short/full lengths and reject bad full check digits,
- curated UPC-E supports standards-defined UPC-E0 compressed input only,
- Interleaved 2 of 5 rejects odd digit counts rather than allowing BWIP to silently prefix `0`,
- independent self-test compares against Qraft's canonical encoded payload,
- successful retail project saves persist the canonical value,
- add-ons, UPC-E1 and GS1/FNC transformations remain closed until dedicated product contracts exist.

Why:

A renderer-side transformation can produce a technically valid symbol while making Qraft's preview,
portable project and independent decoder disagree about what was encoded. Check digits and other
meaningful transformations therefore belong in Qraft's domain validation layer. The vendor adapter
receives a complete value and is not allowed to become the source of product semantics.
