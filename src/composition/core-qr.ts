import { createExportCode } from "@/application/export/export-code";
import { createGenerateCode } from "@/application/generate/generate-code";
import { payloadRegistry } from "@/core/payload/payload-registry";
import { pngExporter } from "@/engines/export/png/png-exporter";
import { svgExporter } from "@/engines/export/svg/svg-exporter";
import { qrRenderer } from "@/engines/render/qr/qr-renderer";

export const generateCode = createGenerateCode({
  payloads: payloadRegistry,
  renderer: qrRenderer,
});

export const exportCode = createExportCode({
  svg: svgExporter,
  png: pngExporter,
});
