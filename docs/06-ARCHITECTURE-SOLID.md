# 06 — Architecture & SOLID

## Goal

Qraft must remain easy to extend when it eventually contains dozens of payload editors, 100+ symbologies, multiple renderers/exporters and multiple scanner paths.

The primary architectural risk is a giant React component plus repeated `if (type === ...)` logic.

## Proposed source tree

```text
src/
  app/
    (marketing)/
    generate/
    scan/
    batch/
    guides/
  core/
    code/
      code-type.ts
      capabilities.ts
    payload/
      payload.ts
      payload-registry.ts
      codecs/
    design/
      design-config.ts
      presets.ts
    quality/
      rules.ts
      findings.ts
    project/
      qraft-project.schema.ts
      migrations/
  application/
    generate/
      generate-code.ts
    decode/
      decode-code.ts
    export/
      export-code.ts
    batch/
      run-batch.ts
  composition/
    core-qr.ts
  engines/
    render/
      standard-qr/
      styled-qr/
      bwip/
    decode/
      native-barcode-detector/
      zxing/
    export/
      svg/
      raster/
      pdf/
      zip/
  features/
    generator/
      components/
      hooks/
      store/
    scanner/
    batch/
    print/
  components/
    ui/
    brand/
    layout/
  lib/
    browser/
    files/
    math/
    security/
  workers/
    batch.worker.ts
    raster.worker.ts
  test/
    vectors/
    factories/
```

## Composition root

Concrete adapters are wired in `src/composition/`, not inside application use cases.

The application layer accepts Qraft-owned ports/dependencies; the composition root selects the current renderer/exporters. This keeps engine replacement out of domain/application code and prevents React features from importing vendor adapters directly.

## Core contracts

### Payload codec

```ts
export interface PayloadCodec<TData, TPayload extends string = string> {
  readonly id: string;
  parseInput(input: unknown): TData;
  encode(data: TData): TPayload;
  inspect(payload: string): PayloadInspection<TData> | null;
}
```

A codec never draws a code.

### Renderer

```ts
export interface CodeRenderer<TConfig = unknown> {
  readonly id: string;
  supports(request: RenderRequest): boolean;
  render(request: RenderRequest<TConfig>): Promise<RenderedCode>;
}
```

Capability-driven result:

```ts
type RenderedCode = {
  width: number;
  height: number;
  svg?: string;
  rasterize?: (options: RasterOptions) => Promise<Blob>;
  metadata: RenderMetadata;
};
```

### Decoder

```ts
export interface Decoder {
  readonly id: string;
  canDecode(input: DecodeInput): Promise<boolean>;
  decode(input: DecodeInput, options?: DecodeOptions): Promise<DecodeResult[]>;
}
```

### Exporter

```ts
export interface Exporter {
  readonly format: ExportFormat;
  supports(rendered: RenderedCode): boolean;
  export(request: ExportRequest): Promise<ExportArtifact>;
}
```

## Registries instead of switches

Payload registration concept:

```ts
payloadRegistry.register({
  id: "wifi",
  label: "Wi-Fi",
  category: "popular",
  schema: wifiSchema,
  codec: wifiCodec,
  editor: lazy(() => import("./WifiEditor")),
  samples: [...]
});
```

Symbology metadata:

```ts
{
  id: "ean13",
  label: "EAN-13",
  family: "linear",
  tags: ["retail", "gtin"],
  renderer: { engine: "bwip", symbology: "ean13" },
  constraints: ...
}
```

Benefits:

- searchable catalog,
- generated docs,
- capabilities from one source,
- additive extension.

## SOLID mapping

### Single Responsibility

- codec = payload semantics,
- renderer = drawing,
- exporter = file artifact,
- quality rule = finding,
- UI = presentation/orchestration.

### Open/Closed

New formats are registry entries/adapters rather than central conditionals.

### Liskov Substitution

Renderers share a capability contract; app does not assume styled QR can draw EAN-13.

### Interface Segregation

Avoid a god interface with `setLogo`, `setBars`, `setECC`, `setGS1` for every code.

### Dependency Inversion

Use cases depend on ports; packages stay in `engines/`.

## Capability model

```ts
type RenderCapabilities = {
  vector: boolean;
  raster: boolean;
  logo: boolean;
  gradient: boolean;
  errorCorrection: boolean;
  humanReadableText: boolean;
  quietZone: boolean;
  physicalSizing: boolean;
};
```

UI controls are derived from capability + product rules.

## Qraft-owned design model

Never save `qr-code-styling` option objects directly.

```ts
type QraftQrDesign = {
  foreground: Paint;
  background: Paint | "transparent";
  moduleShape: ModuleShape;
  eyeFrame: EyeFrameShape;
  eyeDot: EyeDotShape;
  logo?: QraftLogoConfig;
  quietZoneModules: number;
};
```

Adapters map Qraft types to vendor types.

This protects:

- project files,
- presets,
- UI,
- migration path.

## Project file envelope

```json
{
  "format": "qraft-project",
  "schemaVersion": 1,
  "createdWith": "1.0.0",
  "code": {
    "payloadType": "wifi",
    "symbology": "qrcode",
    "data": {}
  },
  "design": {},
  "exportDefaults": {}
}
```

Requirements:

- schema validation,
- migration pipeline,
- max embedded asset size,
- no executable content.

## Error model

Use typed failures:

```ts
type QraftError =
  | ValidationError
  | RenderError
  | DecodeError
  | ExportError
  | UnsupportedCapabilityError
  | FileImportError;
```

The UI maps technical errors to humane copy.

Do not log raw sensitive payload data.

## Cancellation

Long work accepts `AbortSignal`:

```ts
runBatch(job, { signal, onProgress });
```

Cancel must actually cancel, not only hide a spinner.

## Worker protocol

Use typed/versioned messages:

```ts
type WorkerRequest =
  | { type: "BATCH_START"; jobId: string; payload: ... }
  | { type: "BATCH_CANCEL"; jobId: string };

type WorkerResponse =
  | { type: "PROGRESS"; jobId: string; completed: number; total: number }
  | { type: "RESULT"; jobId: string; ... }
  | { type: "ERROR"; jobId: string; ... };
```

No DOM objects in worker messages.

## Rendering lifecycle

```text
form input
→ schema validation
→ payload codec
→ RenderRequest
→ renderer selection
→ render
→ quality rules
→ optional local decode self-test
→ preview
→ exporter
```

Every stage is independently testable.

## Quality rules as plugins

```ts
interface QualityRule {
  id: string;
  applies(context: QualityContext): boolean;
  evaluate(context: QualityContext): QualityFinding[];
}
```

Examples:

- `qr-quiet-zone`
- `qr-logo-occlusion`
- `qr-contrast`
- `qr-inversion`
- `qr-self-decode`
- `barcode-min-bar-width`

## Anti-corruption layer

Vendor-specific names stay inside adapters:

- BWIPP option spelling,
- QR styling enums,
- ZXing result classes.

The rest of Qraft sees Qraft-owned types.

## Code smells to reject

- repeated `if (type === ...)`,
- renderer imports in `components/ui`,
- a 1000-line studio page,
- duplicated URL/Wi‑Fi/vCard serialization,
- `any` renderer config plumbing,
- unvalidated JSON import,
- base64 blobs in global state,
- capability flags scattered instead of centralized metadata.

## Phase 2A implementation note — canonical styled artifact

Phase 2A keeps the safe standard renderer as a structural oracle and adds a browser-only designer adapter.

`QraftQrDesign` lives in `core/design`; `qr-code-styling` option names remain inside `engines/render/designer-qr`. The designer adapter asks the standard renderer for version/ECC/quiet-zone metadata and a verification matrix, then generates the user-facing SVG through the isolated designer engine.

`RenderedCode.svg` is the canonical preview/export artifact. `RenderedCode.verificationMatrix` is explicitly a standards-oriented reference and is not assumed to share the styled engine's mask pattern. Raster exporters therefore rasterize the canonical SVG instead of repainting the verification matrix.

`QrRenderer` is the engine-selection seam for ordinary QR. The untouched default design stays on `StandardQrRenderer`; only a visual design that differs from the safe baseline reaches `DesignerQrRenderer`. This keeps `qr-code-styling` lazy and prevents a UI conditional from deciding which vendor engine to use.

The package runtime is dynamically imported only after a browser check, preserving the static/client-first boundary and avoiding eager Next.js server evaluation.

## Phase 2B implementation note — quality and independent self-test

Phase 2B turns the quality step in the rendering lifecycle into explicit Qraft-owned contracts.

`src/core/quality/` contains pure QR findings, severity, metrics and rule evaluation. The current rules inspect Qraft design values plus Qraft render metadata; they never import the renderer or decoder packages.

The artifact self-test is deliberately separate from deterministic heuristics:

```text
RenderedCode.svg
→ application self-test use case
→ QrArtifactDecoder port
→ lazy browser decoder adapter
→ exact raw-payload comparison
```

The decoder result is a string only at the port boundary. ZXing classes/maps/results stay inside `src/engines/decode/zxing/`, and the application layer reduces the result to `passed`, `decode-failed` or `payload-mismatch` without returning the raw payload.

`@zxing/library` is dynamically imported only when the user explicitly runs the self-test. This keeps the decoder out of initial generation/landing execution and preserves the client-first/static boundary.

Quality findings and self-test have different responsibilities:

- deterministic rules explain visible design risks immediately,
- self-test checks whether a representative raster of the exact canonical SVG can be independently decoded,
- a failed self-test is presented as Risk,
- neither path is certification.

The seam is intentionally ready for Phase 2C logo occlusion and later barcode-specific quality rules without putting vendor logic into `GenerateStudio`.

## Phase 2C implementation note — portable logo geometry, ephemeral runtime asset

Phase 2C deliberately separates **logo configuration** from **logo bytes**.

`QraftQrDesign.logo` stores only portable geometry (`sizePercent`, `paddingModules`). The prepared browser image travels separately as `RenderRequest.options.logoAsset`, containing a per-selection fingerprint, an object URL and normalized square dimensions. The source `File`, normalized `Blob` and base64 data are never persisted in the domain design object.

```text
QraftQrDesign.logo            RenderRequest.logoAsset
portable geometry             ephemeral browser locator
        \                         /
         \                       /
          → DesignerQrRenderer ←
                   ↓
          self-contained SVG
```

The application owns input decoding/normalization and object-URL lifetime. The designer adapter owns the translation from Qraft logo geometry to renderer-specific image options. Quality rules consume only Qraft geometry + render metadata. This keeps future project-file migrations, renderer replacement and scanner work independent from browser object URLs and vendor option names.

## Phase 2D implementation note — export policy and portable projects

Phase 2D adds two boundaries without reversing earlier SOLID decisions.

### Raster export

Portable raster-size policy lives in `core/export/`; browser Canvas mechanics remain in `engines/export/`. PNG, JPEG and WebP all consume the same canonical SVG, so styling/logo behavior cannot drift between preview and export.

### Project persistence

`.qraft.json` is parsed as untrusted input and reconstructed into fresh Qraft domain values. The project schema never stores vendor renderer option objects or browser object URLs. The application layer may embed the already-normalized local PNG logo as bounded base64 only when the user explicitly saves a portable project.

```text
untrusted JSON
→ size/schema/version checks
→ explicit migration chain
→ fresh Qraft domain values
→ payload codec validation
→ optional re-inspected PNG asset
→ studio state
```

No generic deep merge is used for project import.
