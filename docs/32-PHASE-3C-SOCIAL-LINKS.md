# Phase 3C Step 2 — Social Link helper

## Goal

Add a curated social/profile intent without turning Qraft into a hosted bio-page or redirect product.

## Scope

Step 2 adds one `social` payload with six platform choices:

- X,
- Instagram,
- TikTok,
- YouTube,
- LinkedIn,
- Facebook.

The editor accepts either a shorthand handle/identifier or a full HTTPS URL for the selected platform.

## Architecture

`SocialLinkEditor` owns presentation only. `socialLinkCodec` owns platform selection, shorthand URL construction, HTTPS/host validation and payload inspection. The payload registry remains the only generator registration point. Renderer, export, Quality Assistant and project orchestration do not branch on Social Link.

## Shorthand behavior

- X → `https://x.com/<handle>`
- Instagram → `https://www.instagram.com/<username>/`
- TikTok → `https://www.tiktok.com/@<username>`
- YouTube → `https://www.youtube.com/@<handle>`
- LinkedIn → `https://www.linkedin.com/in/<slug>`
- Facebook → `https://www.facebook.com/<username>`

A leading `@` is accepted for shorthand. YouTube shorthand is percent-encoded so international handles do not depend on ASCII-only assumptions.

A pasted full URL is not rewritten after validation. This matters for LinkedIn Pages, locale/country LinkedIn hosts and other official platform URL forms.

## Security / privacy boundary

The curated helper:

- requires HTTPS for full URLs,
- rejects embedded credentials and custom ports,
- checks the selected platform against a bounded official-host policy,
- does not fetch remote profiles,
- does not check ownership/existence/visibility,
- does not append analytics/tracking parameters,
- never auto-opens the destination.

The user-supplied value remains local to the normal Qraft generation/project pipeline.

## Inspector precedence

Generic inspection tries:

1. dedicated structured signatures such as Event/vCard/Wi-Fi,
2. WhatsApp,
3. Social for known social HTTPS hosts,
4. generic HTTP(S) URL,
5. Text fallback.

App Link is deliberately not inferred from an HTTPS URL because app/domain association cannot be proven from the payload string alone. Raw also remains preferred-intent-only because it accepts every non-empty value.

## Project compatibility

`social` is added to the schema-v1 payload allow-list. The project envelope does not change, so no schema bump or migration is required. Import still revalidates the payload through the current codec.

## Tests

Step 2 covers:

- shorthand construction,
- full-URL preservation,
- platform/host mismatch rejection,
- HTTPS/credentials/port restrictions,
- documented X handle grammar,
- international YouTube handle encoding,
- generic inspector precedence,
- registry ordering,
- golden QR round-trip,
- `.qraft.json` round-trip,
- desktop/mobile browser generation, self-test and project export.

## Deferred

Step 2 does not add:

- hosted multi-link pages,
- social API calls or OAuth,
- account verification,
- post analytics,
- dynamic redirects,
- social preview scraping.

Those would introduce network/backend/privacy boundaries that are outside Phase 3C.
