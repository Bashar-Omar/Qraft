# Phase 2D — Export + Portable Projects

## Status

Phase 2D closes the planned Phase 2 Visual Studio scope with:

- JPEG export,
- WebP export,
- curated raster sizing,
- versioned `.qraft.json` save/open,
- migration infrastructure,
- bounded embedded normalized logo assets,
- artifact-level and desktop/mobile browser coverage.

PDF and physical print controls remain Phase 6 work. This slice deliberately does not pull print-layout concerns into the Visual Studio completion gate.

## Export architecture

Export remains a product subsystem rather than component-local canvas code:

```text
RenderedCode.svg (canonical artifact)
        ↓
application Exporter port
   ↙       ↓       ↘
 SVG   raster family
          ↓
  shared SVG → Canvas
    ↙      ↓      ↘
  PNG    JPEG    WebP
```

`src/core/export/raster.ts` owns portable raster-size policy. Browser mechanics stay under `src/engines/export/`.

Curated raster targets are 512, 1024, 2048 and 4096 CSS pixels. The requested target is adjusted downward when necessary so every QR module lands on an integer number of pixels. The UI describes this explicitly instead of pretending an arbitrary requested number is always the exact final dimension.

### PNG

PNG preserves the canonical artifact's alpha/transparency.

### JPEG

JPEG cannot represent alpha. Qraft paints a solid white backing surface before drawing the canonical SVG, then requests `image/jpeg` at quality 0.92.

### WebP

WebP uses the same canonical raster path and requests `image/webp` at quality 0.92. Canvas encoders are allowed by the platform to fall back to PNG when a requested type is unsupported, so Qraft verifies the returned Blob MIME exactly and fails clearly rather than writing PNG bytes with a `.webp` extension.

## Portable project schema v1

The current persistence artifact is intentionally local and account-free:

```json
{
  "kind": "qraft-project",
  "schemaVersion": 1,
  "payload": {
    "id": "url",
    "input": "https://example.com"
  },
  "code": {
    "symbology": "qr",
    "errorCorrectionLevel": "M",
    "design": {}
  },
  "export": {
    "rasterPixelSize": 1024
  },
  "assets": {}
}
```

The real `design` value is the validated Qraft design model, never a `qr-code-styling` option object.

## Import security boundary

Project files are untrusted input. Current boundaries:

- maximum project file: 6 MiB,
- maximum embedded normalized logo: 4 MiB,
- maximum JSON nesting: 32,
- maximum traversed JSON values: 5,000,
- strict supported top-level/nested project keys,
- blocked prototype-sensitive payload keys,
- finite JSON numbers only,
- explicit project kind + integer schema version,
- future schema versions fail with a clear message,
- unsupported older versions fail through the migration registry,
- payload IDs/ECC/raster sizes/design fields are parsed into fresh Qraft domain values,
- imported payload input is re-validated by the current payload codec,
- embedded logo base64 length must match metadata,
- embedded logo bytes are re-inspected as a real PNG and must match declared square dimensions,
- no unsafe deep merge.

## Migration discipline

`migrateQraftProject()` is the only schema-version entry point. v1 is the first real schema, so the migration table is intentionally empty today. Future versions add an explicit `n → n+1` transform and tests; callers never merge old project objects directly into current application state.

Newer project files are not guessed at or partially loaded.

## Logo portability

Phase 2C deliberately kept the runtime logo `Blob`/object URL outside the portable design model. Phase 2D keeps that architectural boundary and only embeds the already-normalized square PNG when the user explicitly saves a project.

The saved JSON contains bounded base64 PNG data plus width/height/name metadata. On import it becomes a fresh Blob and short-lived object URL at the application/UI boundary. The object URL is still revoked on replace/remove/unmount.

## Browser compatibility policy

The web platform guarantees PNG canvas export; JPEG/WebP availability can vary. Qraft does not infer success from a filename. The exporter checks the actual returned MIME type.

A browser that falls back from requested WebP/JPEG to PNG receives a clear export error. This keeps extension, MIME and bytes consistent.

## Testing gate

Automated coverage includes:

- raster-size parsing and integer-module alignment,
- project schema v1 parsing into fresh values,
- future/unsupported-version rejection,
- malformed/unknown/dangerous project input rejection,
- project logo metadata checks,
- project application round-trip with and without a logo,
- re-validation of imported payload data,
- real PNG/JPEG/WebP browser download signatures,
- `.qraft.json` browser save/open state restoration,
- the existing independent browser self-decode of every shipped Phase 2 preset,
- desktop and mobile Chromium profiles.

Phase 2 is not considered complete until `scripts/verify.ps1` stays green with these tests included.
