import { createExportCode } from "@/application/export/export-code";
import { createGenerateCode } from "@/application/generate/generate-code";
import { createSelfTestQr } from "@/application/quality/self-test-qr";
import { RendererRegistry } from "@/core/code/renderer-registry";
import type { RenderedQrCode } from "@/core/code/render";
import { payloadRegistry } from "@/core/payload/payload-registry";
import { pngExporter } from "@/engines/export/png/png-exporter";
import { jpegExporter } from "@/engines/export/jpeg/jpeg-exporter";
import { webpExporter } from "@/engines/export/webp/webp-exporter";
import { svgExporter } from "@/engines/export/svg/svg-exporter";
import { zxingQrArtifactDecoder } from "@/engines/decode/zxing/zxing-qr-artifact-decoder";
import { qrRenderer } from "@/engines/render/qr/qr-renderer";

export const codeRenderer = new RendererRegistry<RenderedQrCode>([qrRenderer]);

export const generateCode = createGenerateCode({
  payloads: payloadRegistry,
  renderer: codeRenderer,
});

export const exportCode = createExportCode({
  svg: svgExporter,
  png: pngExporter,
  jpeg: jpegExporter,
  webp: webpExporter,
});

export const selfTestQr = createSelfTestQr(zxingQrArtifactDecoder);
