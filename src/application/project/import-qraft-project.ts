import { validateBarcodePayload } from "@/core/code/barcode-input";
import type { QrErrorCorrectionLevel } from "@/core/code/render";
import type { BarcodeSymbologyId } from "@/core/code/symbology";
import type { QraftQrDesign } from "@/core/design/qr-design";
import { inspectQrLogoFileBytes } from "@/core/design/qr-logo-file";
import type { RasterPixelSize } from "@/core/export/raster";
import type { PayloadId } from "@/core/payload/payload";
import { payloadRegistry } from "@/core/payload/payload-registry";
import {
  QRAFT_PROJECT_MAX_FILE_BYTES,
  QraftProjectValidationError,
  parseQraftProjectJson,
  type QraftProjectDocumentV2,
} from "@/core/project/qraft-project";

export type ImportedQraftProjectLogo = Readonly<{
  blob: Blob;
  name: string;
  width: number;
  height: number;
  renderUri: string;
}>;

export type ImportedQrProject = Readonly<{
  mode: "qr";
  payloadId: PayloadId;
  input: unknown;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  design: QraftQrDesign;
  rasterPixelSize: RasterPixelSize;
  logo?: ImportedQraftProjectLogo;
}>;

export type ImportedBarcodeProject = Readonly<{
  mode: "barcode";
  symbology: BarcodeSymbologyId;
  payload: string;
  humanReadableText: boolean;
  rasterPixelSize: RasterPixelSize;
}>;

export type ImportedQraftProject = ImportedQrProject | ImportedBarcodeProject;

function base64ToBytes(value: string): Uint8Array {
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new QraftProjectValidationError("Embedded project logo data could not be decoded.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function restoreLogo(document: QraftProjectDocumentV2): ImportedQraftProjectLogo | undefined {
  const logo = document.assets.logo;
  if (!logo) return undefined;

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
    renderUri: `data:image/png;base64,${logo.data}`,
  };
}

export async function importQraftProject(file: Blob): Promise<ImportedQraftProject> {
  if (file.size < 1 || file.size > QRAFT_PROJECT_MAX_FILE_BYTES) {
    throw new QraftProjectValidationError("Qraft project files must be smaller than 6 MiB.");
  }

  const document = parseQraftProjectJson(await file.text());
  if (document.content.kind === "payload" && document.code.symbology === "qr") {
    const definition = payloadRegistry.get(document.content.payloadId);
    try {
      definition.parseAndEncode(document.content.input);
    } catch {
      throw new QraftProjectValidationError(
        "The project payload is not valid for the selected Qraft content type.",
      );
    }

    const logo = restoreLogo(document);
    return {
      mode: "qr",
      payloadId: document.content.payloadId,
      input: document.content.input,
      errorCorrectionLevel: document.code.errorCorrectionLevel,
      design: document.code.design,
      rasterPixelSize: document.export.rasterPixelSize,
      ...(logo ? { logo } : {}),
    };
  }

  if (document.content.kind === "barcode" && document.code.symbology !== "qr") {
    validateBarcodePayload(document.code.symbology, document.content.value);
    return {
      mode: "barcode",
      symbology: document.code.symbology,
      payload: document.content.value,
      humanReadableText: document.code.humanReadableText,
      rasterPixelSize: document.export.rasterPixelSize,
    };
  }

  throw new QraftProjectValidationError("Project content and code settings are inconsistent.");
}
