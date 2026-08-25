import { createExportCode } from "@/application/export/export-code";
import { createGenerateCode } from "@/application/generate/generate-code";
import { payloadRegistry } from "@/core/payload/payload-registry";
import { pngExporter } from "@/engines/export/png/png-exporter";
import { svgExporter } from "@/engines/export/svg/svg-exporter";
import { standardQrRenderer } from "@/engines/render/standard-qr/standard-qr-renderer";

export const generateCode = createGenerateCode({
  payloads: payloadRegistry,
  renderer: standardQrRenderer,
});

export const exportCode = createExportCode({
  svg: svgExporter,
  png: pngExporter,
});
