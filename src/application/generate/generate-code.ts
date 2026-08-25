import {
  SAFE_QR_DEFAULTS,
  type CodeRenderer,
  type QrErrorCorrectionLevel,
  type RenderedCode,
} from "@/core/code/render";
import type { PayloadRegistry } from "@/core/payload/payload-registry";
import type { PayloadId, RegisteredPayloadDefinition } from "@/core/payload/payload";

export type GenerateCodeRequest = Readonly<{
  payloadId: PayloadId;
  input: unknown;
  errorCorrectionLevel?: QrErrorCorrectionLevel;
}>;

export type GeneratedCode = Readonly<{
  definition: RegisteredPayloadDefinition;
  payload: string;
  parsedData: unknown;
  rendered: RenderedCode;
}>;

export type GenerateCodeDependencies = Readonly<{
  payloads: Pick<PayloadRegistry, "get">;
  renderer: CodeRenderer;
}>;

export function createGenerateCode({ payloads, renderer }: GenerateCodeDependencies) {
  return async function generateCode(request: GenerateCodeRequest): Promise<GeneratedCode> {
    const definition = payloads.get(request.payloadId);
    const encoded = definition.parseAndEncode(request.input);
    const rendered = await renderer.render({
      symbology: "qr",
      payload: encoded.payload,
      options: {
        errorCorrectionLevel: request.errorCorrectionLevel ?? SAFE_QR_DEFAULTS.errorCorrectionLevel,
        quietZoneModules: SAFE_QR_DEFAULTS.quietZoneModules,
      },
    });

    return {
      definition,
      payload: encoded.payload,
      parsedData: encoded.data,
      rendered,
    };
  };
}
