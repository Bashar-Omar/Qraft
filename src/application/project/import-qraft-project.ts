import type { QraftQrDesign } from "@/core/design/qr-design";
import { inspectQrLogoFileBytes } from "@/core/design/qr-logo-file";
import { payloadRegistry } from "@/core/payload/payload-registry";
import {
  QRAFT_PROJECT_MAX_FILE_BYTES,
  QraftProjectValidationError,
  parseQraftProjectJson,
  type QraftProjectDocumentV1,
} from "@/core/project/qraft-project";
import type { RasterPixelSize } from "@/core/export/raster";
import type { PayloadId } from "@/core/payload/payload";
import type { QrErrorCorrectionLevel } from "@/core/code/render";

export type ImportedQraftProjectLogo = Readonly<{
  blob: Blob;
  name: string;
  width: number;
  height: number;
}>;

export type ImportedQraftProject = Readonly<{
  payloadId: PayloadId;
  input: unknown;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  design: QraftQrDesign;
  rasterPixelSize: RasterPixelSize;
  logo?: ImportedQraftProjectLogo;
}>;

function base64ToBytes(value: string): Uint8Array {
  let binary: string;

  try {
    binary = atob(value);
  } catch {
    throw new QraftProjectValidationError("Embedded project logo data could not be decoded.");
  }

  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function restoreLogo(document: QraftProjectDocumentV1): ImportedQraftProjectLogo | undefined {
  const logo = document.assets.logo;
  if (!logo) {
    return undefined;
  }

  const bytes = base64ToBytes(logo.data);
  if (bytes.byteLength !== logo.bytes) {
    throw new QraftProjectValidationError(
      "Embedded project logo byte count does not match its metadata.",
    );
  }

  const inspection = inspectQrLogoFileBytes(bytes, bytes.byteLength);
  if (
    inspection.mimeType !== "image/png" ||
    inspection.width !== logo.width ||
    inspection.height !== logo.height ||
    inspection.width !== inspection.height
  ) {
    throw new QraftProjectValidationError(
      "Embedded project logo content does not match its declared PNG metadata.",
    );
  }

  return {
    blob: new Blob([copyBytesToArrayBuffer(bytes)], { type: "image/png" }),
    name: logo.name,
    width: logo.width,
    height: logo.height,
  };
}

export async function importQraftProject(file: Blob): Promise<ImportedQraftProject> {
  if (file.size < 1 || file.size > QRAFT_PROJECT_MAX_FILE_BYTES) {
    throw new QraftProjectValidationError("Qraft project files must be smaller than 6 MiB.");
  }

  const document = parseQraftProjectJson(await file.text());
  const definition = payloadRegistry.get(document.payload.id);

  try {
    definition.parseAndEncode(document.payload.input);
  } catch {
    throw new QraftProjectValidationError(
      "The project payload is not valid for the selected Qraft content type.",
    );
  }

  const logo = restoreLogo(document);

  return {
    payloadId: document.payload.id,
    input: document.payload.input,
    errorCorrectionLevel: document.code.errorCorrectionLevel,
    design: document.code.design,
    rasterPixelSize: document.export.rasterPixelSize,
    ...(logo ? { logo } : {}),
  };
}
