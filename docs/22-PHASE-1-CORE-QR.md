# 22 — Phase 1 Core QR implementation

## Status

Phase 1 is split into two reviewable vertical slices.

- **Phase 1A — merged:** one complete URL/Text → QR → preview/export path.
- **Phase 1B — current:** complete the roadmap's common payload set through the same registry-driven architecture.

The Phase 1 roadmap target is URL/Text/Email/Phone/SMS/Wi-Fi, safe standard QR, live preview, ECC, quiet zone, SVG/PNG and responsive desktop/mobile behavior.

## Phase 1A foundation

Phase 1A established:

- Qraft-owned `PayloadCodec` and payload definition contracts,
- payload registry with duplicate-id protection,
- URL and plain Text codecs,
- Qraft-owned QR render request/result contracts,
- standards-first `StandardQrRenderer`,
- `qr@0.6.0` isolated behind the renderer adapter,
- safe Medium ECC default,
- fixed four-module quiet-zone baseline,
- normalized Qraft-owned matrix and render metadata,
- live browser preview,
- SVG exporter,
- crisp canvas PNG exporter,
- desktop/mobile Playwright coverage,
- software render→decode regression coverage.

## Phase 1B common payloads

Phase 1B adds four payloads without changing renderer internals.

### Email

The curated Email editor supports:

- up to 10 comma-separated common mailbox addresses,
- subject,
- text body,
- UTF-8 percent encoding,
- CRLF line endings in the encoded `body` field.

Qraft produces an RFC 6068-style `mailto:` URI. The curated validator intentionally targets common mailbox syntax rather than claiming complete Email Address Internationalization support.

### Phone

Phone payloads use `tel:` and normalize visual separators away before rendering.

The curated editor requires international `+country-code` form. This avoids inventing a `phone-context` for local numbers and keeps the generated URI unambiguous.

### SMS

SMS payloads use the standards-based `sms:` URI with:

- one international recipient,
- optional UTF-8 body encoded in the `body` field.

The editor keeps transport behavior honest: Qraft prepares the URI but does not claim every messaging app handles every optional behavior identically.

### Wi-Fi

The Wi-Fi editor supports:

- WPA/WPA2 (`T:WPA`),
- WEP with a legacy warning,
- open networks (`T:nopass`),
- hidden-network flag,
- SSIDs up to 32 UTF-8 bytes,
- local-only password handling.

Values escape the common ZXing Wi-Fi QR reserved characters:

```text
\\ ; , " :
```

Open-network payloads never serialize a password, even if stale UI data existed before the security mode changed.

## Editor architecture change

Phase 1A's editor props were string-only because URL and Text were both scalar drafts. Phase 1B changes the generator editor boundary to `unknown` draft values plus typed field issues.

Each payload-specific editor owns its draft shape and validation-field mapping. The shared `GenerateStudio` only knows:

```text
payload id
→ registry definition
→ editor registration
→ unknown draft
→ payload codec
→ QR renderer
```

This is deliberate: adding a structured payload must not require serializing form state into fake JSON strings or adding payload-specific conditions to the renderer/studio orchestration.

The studio also fingerprints the active payload draft + ECC request. While an asynchronous render for new input is pending, Qraft treats the previous result as stale and disables export rather than allowing an older QR artifact to be downloaded under the new payload selection.

## Standards/research basis

Phase 1B implementation was re-checked against:

- RFC 6068 — `mailto:` URI scheme,
- RFC 3966 — `tel:` URI scheme,
- RFC 5724 — `sms:` URI scheme,
- ZXing Barcode Contents / Wi-Fi result parser — common Wi-Fi QR syntax and escaping behavior.

These references define/describe payload serialization. They do not make Qraft a formal conformance or scanner-certification tool.

## Safe QR baseline

All six Phase 1 payloads still use the restrained standard profile:

- black modules on white,
- four-module quiet zone,
- explicit L/M/Q/H ECC,
- Medium (`M`) default,
- no logo occlusion,
- no styling that can reduce finder/timing readability.

Creative styling remains Phase 2 work.

## Test strategy

### Unit/domain

Coverage includes:

- URL validation/normalization,
- Text preservation,
- Email recipient/header/body serialization,
- Phone normalization and global-number validation,
- SMS body serialization,
- Wi-Fi escaping, open/protected/hidden behavior and SSID byte limits,
- registry behavior,
- matrix/render invariants.

### Golden software regression

Known common payload fixtures are:

```text
codec
→ raw payload
→ standard QR renderer
→ normalized matrix
→ rasterized test bitmap
→ decoder
→ raw payload equality
```

The decoder currently comes from the same package family as the encoder. This catches software regressions but is **not independent certification**.

### Browser E2E

Playwright runs in desktop Chromium and a mobile Chromium device profile. It verifies:

- the studio is reachable,
- URL normalization,
- SVG/PNG download,
- Text + ECC controls,
- Email/Phone/SMS/Wi-Fi editor wiring,
- Wi-Fi SVG export,
- theme persistence.

## Privacy notes

- payload data stays in browser memory during normal generation,
- URL generation does not fetch its destination,
- Wi-Fi passwords are not persisted automatically,
- open Wi-Fi output cannot leak a stale password,
- tests use fake example-only credentials and numbers.

## Phase 1 gate

Before merge:

```text
pnpm install --frozen-lockfile
pnpm format
.\scripts\verify.ps1
```

Then manually scan representative URL, Email, SMS and Wi-Fi outputs on physical phones where practical.

The protected-main PR must pass Quality/Build and E2E checks.

## Next phase — Phase 2 Visual Studio

After Phase 1B merges, the roadmap advances to:

1. designer QR adapter,
2. foreground/background colors and gradients,
3. module/eye styles,
4. local logo handling,
5. Qraft-owned presets,
6. Quality Assistant v1,
7. JPEG/WebP export,
8. versioned `.qraft.json` projects.

The safe standard renderer remains available as the conservative baseline and test oracle while creative rendering is introduced.
