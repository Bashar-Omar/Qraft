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
  engines/
    render/
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
