# 07 — Payloads & Barcode Catalog

## Payload vs symbology

Qraft must separate these concepts.

**Payload = what the data means**

- URL,
- Wi‑Fi,
- vCard,
- email,
- event.

**Symbology = how it is encoded**

- QR Code,
- rMQR,
- Data Matrix,
- Code 128,
- PDF417.

This separation enables one payload to be encoded differently when supported.

## Common payload codecs

### URL

- trim,
- validate,
- suggest `https://` when missing,
- do not fetch the URL just to generate it.

### Text

- plain text,
- character/byte/density indicators.

### Email

Fields:

- recipients,
- subject,
- body.

Encode `mailto:` correctly.

### Phone

Encode `tel:`.

### SMS

- recipient,
- body.
  Test syntax across target mobile platforms.

### WhatsApp

- international number,
- optional text.
  Provide raw-link advanced mode.

### Wi‑Fi

- SSID,
- security,
- password,
- hidden.

Explicit security options:

- WPA/WPA2,
- WEP with legacy warning,
- none.

Test escaping carefully.

### vCard

v1 fields:

- name,
- organization,
- title,
- phones,
- emails,
- website,
- address,
- note.

Use a tested serializer/escaping model.

### MeCard

P1 compatibility format.

### Event

iCalendar:

- title,
- start/end,
- timezone/all-day,
- location,
- description,
- URL.

Timezone behavior needs tests.

### Geo

- latitude,
- longitude,
- optional label/query.

### OTP

`otpauth://` may contain secrets.

Rules:

- local only,
- sensitivity warning,
- never analytics/logged,
- no auto persistence,
- exclude from share-by-URL.

### GS1 Digital Link

Structured advanced editor:

- primary key,
- identifier,
- qualifiers,
- data attributes,
- resolver/base URI.

Explain that Qraft does not allocate GS1 identifiers.

## Curated barcode catalog

### 1D common

- Code 128
- GS1-128
- Code 39
- Code 93
- Codabar
- Interleaved 2 of 5
- ITF-14
- MSI/Plessey in Expert
- Code 11 in Expert

### Retail

- EAN-13
- EAN-8
- UPC-A
- UPC-E
- ISBN
- ISSN
- ISMN
- GS1 DataBar families

Strict check-digit/length UX is required.

### 2D common

- QR Code
- Micro QR
- rMQR
- Data Matrix
- GS1 Data Matrix
- Aztec
- PDF417
- MicroPDF417

### 2D advanced, subject to installed renderer tests

- MaxiCode
- DotCode
- Han Xin
- Codablock F
- GS1 QR
- GS1 Digital Link QR
- HIBC variants
- Swiss QR.

### Postal/logistics/specialty

Expose through Expert Catalog when renderer support and metadata are verified.

## Expert Catalog metadata

```ts
type SymbologyDefinition = {
  id: SymbologyId;
  rendererId: string;
  label: string;
  aliases: string[];
  family: "linear" | "matrix" | "stacked" | "postal" | ...;
  domainTags: string[];
  input: InputConstraint;
  capabilities: SymbologyCapabilities;
  status: "curated" | "expert" | "experimental";
  docs: string;
};
```

### Curated

Full hand-designed editor + validation + docs.

### Expert

Renderer-backed advanced format with generic validated input.

### Experimental

Hidden behind a deliberate toggle until golden vectors exist.

## Honest support language

The engine may render 100+ formats. Qraft UI should state:

- **Curated** — first-class Qraft workflow.
- **Expert** — advanced renderer-backed.
- **Experimental** — not yet covered to the same test level.

This is stronger than pretending all formats have identical product support.

## Compatibility matrix per symbology

Store:

- render engine,
- SVG support,
- raster support,
- logo,
- gradient,
- ECC,
- human-readable text,
- native scanner compatibility,
- ZXing compatibility,
- print helper,
- structured payload compatibility.

The UI must hide irrelevant controls automatically.

## Validation hierarchy

1. syntax,
2. character/length,
3. domain-specific checks,
4. renderer preflight,
5. self-decode when available.

Renderer exceptions are last defense, not form validation.

## Raw Mode

Allow:

- arbitrary text,
- selected symbology,
- allow-listed advanced renderer options.

Never allow:

- arbitrary JS,
- unvalidated raw HTML/SVG injection,
- unsafe renderer config object merging.

## Unicode

Do not assume:

- JS character length == encoded bytes,
- all 1D codes accept UTF‑8,
- all scanners interpret ECI identically.

Document important format character sets.
