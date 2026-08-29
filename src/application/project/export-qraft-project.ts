import type { QrErrorCorrectionLevel } from "@/core/code/render";
import type { QraftQrDesign } from "@/core/design/qr-design";
import type { PayloadId } from "@/core/payload/payload";
import {
  QRAFT_PROJECT_KIND,
  QRAFT_PROJECT_MAX_EMBEDDED_LOGO_BYTES,
  QRAFT_PROJECT_MAX_FILE_BYTES,
  QRAFT_PROJECT_SCHEMA_VERSION,
  migrateQraftProject,
  toProjectJsonValue,
  type QraftProjectDocumentV1,
} from "@/core/project/qraft-project";
import type { RasterPixelSize } from "@/core/export/raster";
import { sanitizeFilenameBase } from "@/lib/files/filename";

export type ProjectLogoRuntimeAsset = Readonly<{
  blob: Blob;
  name: string;
  width: number;
  height: number;
}>;

export type QraftProjectExportRequest = Readonly<{
  payloadId: PayloadId;
  input: unknown;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  design: QraftQrDesign;
  rasterPixelSize: RasterPixelSize;
  logo?: ProjectLogoRuntimeAsset;
}>;

export type QraftProjectArtifact = Readonly<{
  blob: Blob;
  filename: string;
  mimeType: "application/json";
}>;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}

export async function exportQraftProject(
  request: QraftProjectExportRequest,
): Promise<QraftProjectArtifact> {
  if (Boolean(request.design.logo) !== Boolean(request.logo)) {
    throw new Error("A saved logo design requires its normalized local logo asset.");
  }

  let embeddedLogo: QraftProjectDocumentV1["assets"]["logo"];

  if (request.logo) {
    if (request.logo.blob.type !== "image/png") {
      throw new Error("Qraft projects can embed only normalized PNG logo assets.");
    }

    if (request.logo.blob.size > QRAFT_PROJECT_MAX_EMBEDDED_LOGO_BYTES) {
      throw new Error("The normalized logo is too large to embed safely in a Qraft project.");
    }

    const bytes = new Uint8Array(await request.logo.blob.arrayBuffer());
    embeddedLogo = {
      encoding: "base64",
      mimeType: "image/png",
      data: bytesToBase64(bytes),
      bytes: bytes.byteLength,
      width: request.logo.width,
      height: request.logo.height,
      name:
        request.logo.name
          .replace(/[\u0000-\u001f\u007f]/g, "-")
          .trim()
          .slice(0, 120) || "logo.png",
    };
  }

  const document: QraftProjectDocumentV1 = {
    kind: QRAFT_PROJECT_KIND,
    schemaVersion: QRAFT_PROJECT_SCHEMA_VERSION,
    payload: {
      id: request.payloadId,
      input: toProjectJsonValue(request.input),
    },
    code: {
      symbology: "qr",
      errorCorrectionLevel: request.errorCorrectionLevel,
      design: request.design,
    },
    export: {
      rasterPixelSize: request.rasterPixelSize,
    },
    assets: embeddedLogo ? { logo: embeddedLogo } : {},
  };

  const validatedDocument = migrateQraftProject(document);
  const text = `${JSON.stringify(validatedDocument, null, 2)}\n`;
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });

  if (blob.size > QRAFT_PROJECT_MAX_FILE_BYTES) {
    throw new Error(
      "This project is too large to save within Qraft's portable-project safety limit.",
    );
  }

  const filenameBase = sanitizeFilenameBase(`qraft-${request.payloadId}`);

  return {
    blob,
    filename: `${filenameBase}.qraft.json`,
    mimeType: "application/json",
  };
}
