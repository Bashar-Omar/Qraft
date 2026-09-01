import { describe, expect, it } from "vitest";

import { exportQraftProject } from "@/application/project/export-qraft-project";
import {
  importQraftProject,
  type ImportedQraftProject,
  type ImportedQrProject,
} from "@/application/project/import-qraft-project";
import { DEFAULT_QR_DESIGN } from "@/core/design/qr-design";

function fakePngHeader(width = 256, height = 256): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return bytes;
}

function copyBytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function expectQr(project: ImportedQraftProject): asserts project is ImportedQrProject {
  expect(project.mode).toBe("qr");
  if (project.mode !== "qr") throw new Error("Expected a QR project.");
}

describe("portable Qraft projects", () => {
  it("exports QR projects as schema v2 and round-trips payload/design/ECC", async () => {
    const artifact = await exportQraftProject({
      mode: "qr",
      payloadId: "url",
      input: "openai.com/research",
      errorCorrectionLevel: "H",
      design: { ...DEFAULT_QR_DESIGN, moduleShape: "dots" },
      rasterPixelSize: 2048,
    });

    expect(artifact.filename).toBe("qraft-url.qraft.json");
    const raw = JSON.parse(await artifact.blob.text()) as Record<string, unknown>;
    expect(raw.schemaVersion).toBe(2);
    expect(raw.content).toMatchObject({ kind: "payload", payloadId: "url" });

    const imported = await importQraftProject(artifact.blob);
    expectQr(imported);
    expect(imported).toMatchObject({
      payloadId: "url",
      input: "openai.com/research",
      errorCorrectionLevel: "H",
      rasterPixelSize: 2048,
      design: { moduleShape: "dots" },
    });
  });

  it("round-trips structured, Event and exact Raw payload input through schema v2", async () => {
    const cases = [
      {
        payloadId: "location" as const,
        input: { latitude: "30.0444", longitude: "31.2357", altitude: "", uncertainty: "25" },
      },
      {
        payloadId: "event" as const,
        input: {
          title: "Qraft planning",
          allDay: false,
          startDate: "",
          endDate: "",
          startDateTime: "2026-09-02T14:00",
          endDateTime: "2026-09-02T15:00",
          timeMode: "utc",
          location: "Studio B",
          description: "Phase 4C project",
          url: "https://example.com/qraft-event",
          uid: "urn:uuid:00000000-0000-4000-8000-000000000888",
          dtstamp: "20260829T123000Z",
        },
      },
      { payloadId: "raw" as const, input: { value: "  raw://example\r\nمرحبا 👋\n  " } },
    ];

    for (const testCase of cases) {
      const artifact = await exportQraftProject({
        mode: "qr",
        payloadId: testCase.payloadId,
        input: testCase.input,
        errorCorrectionLevel: "M",
        design: DEFAULT_QR_DESIGN,
        rasterPixelSize: 1024,
      });
      const imported = await importQraftProject(artifact.blob);
      expectQr(imported);
      expect(imported).toMatchObject({ payloadId: testCase.payloadId, input: testCase.input });
    }
  });

  it("imports legacy schema v1 QR projects through the explicit migration path", async () => {
    const legacy = {
      kind: "qraft-project",
      schemaVersion: 1,
      payload: { id: "url", input: "https://example.com/legacy" },
      code: {
        symbology: "qr",
        errorCorrectionLevel: "M",
        design: DEFAULT_QR_DESIGN,
      },
      export: { rasterPixelSize: 1024 },
      assets: {},
    };

    await expect(
      importQraftProject(new Blob([JSON.stringify(legacy)], { type: "application/json" })),
    ).resolves.toMatchObject({
      mode: "qr",
      payloadId: "url",
      input: "https://example.com/legacy",
      errorCorrectionLevel: "M",
      rasterPixelSize: 1024,
    });
  });

  it("round-trips a bounded normalized PNG logo", async () => {
    const logoBytes = fakePngHeader();
    const design = {
      ...DEFAULT_QR_DESIGN,
      logo: { sizePercent: 20, paddingModules: 0.5 },
    } as const;
    const artifact = await exportQraftProject({
      mode: "qr",
      payloadId: "text",
      input: "Qraft portable project",
      errorCorrectionLevel: "Q",
      design,
      rasterPixelSize: 1024,
      logo: {
        blob: new Blob([copyBytesToArrayBuffer(logoBytes)], { type: "image/png" }),
        name: "brand\u0000-logo.png",
        width: 256,
        height: 256,
      },
    });

    const imported = await importQraftProject(artifact.blob);
    expectQr(imported);
    expect(imported.design.logo).toEqual({ sizePercent: 20, paddingModules: 0.5 });
    expect(imported.logo).toMatchObject({ name: "brand--logo.png", width: 256, height: 256 });
    expect(imported.logo?.blob.type).toBe("image/png");
    expect(imported.logo?.renderUri).toMatch(/^data:image\/png;base64,/);
  });

  it("round-trips curated barcode projects", async () => {
    const code128 = await exportQraftProject({
      mode: "barcode",
      symbology: "code128",
      payload: "QRAFT-128-001",
      humanReadableText: true,
      rasterPixelSize: 2048,
    });
    const importedCode128 = await importQraftProject(code128.blob);
    expect(importedCode128).toEqual({
      mode: "barcode",
      symbology: "code128",
      payload: "QRAFT-128-001",
      humanReadableText: true,
      rasterPixelSize: 2048,
    });

    const dataMatrix = await exportQraftProject({
      mode: "barcode",
      symbology: "datamatrix",
      payload: "Lot-Ä-42",
      humanReadableText: false,
      rasterPixelSize: 1024,
    });
    await expect(importQraftProject(dataMatrix.blob)).resolves.toMatchObject({
      mode: "barcode",
      symbology: "datamatrix",
      payload: "Lot-Ä-42",
      humanReadableText: false,
    });

    const retail = await exportQraftProject({
      mode: "barcode",
      symbology: "ean13",
      payload: "952012345678",
      humanReadableText: true,
      rasterPixelSize: 1024,
    });
    await expect(importQraftProject(retail.blob)).resolves.toEqual({
      mode: "barcode",
      symbology: "ean13",
      payload: "9520123456788",
      humanReadableText: true,
      rasterPixelSize: 1024,
    });

    const pdf417 = await exportQraftProject({
      mode: "barcode",
      symbology: "pdf417",
      payload: "Document Ä-42",
      humanReadableText: false,
      rasterPixelSize: 2048,
    });
    await expect(importQraftProject(pdf417.blob)).resolves.toEqual({
      mode: "barcode",
      symbology: "pdf417",
      payload: "Document Ä-42",
      humanReadableText: false,
      rasterPixelSize: 2048,
    });

    const aztec = await exportQraftProject({
      mode: "barcode",
      symbology: "aztec",
      payload: "Ticket Café",
      humanReadableText: false,
      rasterPixelSize: 1024,
    });
    await expect(importQraftProject(aztec.blob)).resolves.toMatchObject({
      mode: "barcode",
      symbology: "aztec",
      payload: "Ticket Café",
      humanReadableText: false,
    });

    const codabar = await exportQraftProject({
      mode: "barcode",
      symbology: "codabar",
      payload: "A0123456789B",
      humanReadableText: true,
      rasterPixelSize: 1024,
    });
    await expect(importQraftProject(codabar.blob)).resolves.toMatchObject({
      mode: "barcode",
      symbology: "codabar",
      payload: "A0123456789B",
      humanReadableText: true,
    });

    const microqr = await exportQraftProject({
      mode: "barcode",
      symbology: "microqr",
      payload: "MICRO-QRAFT",
      humanReadableText: false,
      rasterPixelSize: 1024,
    });
    await expect(importQraftProject(microqr.blob)).resolves.toMatchObject({
      mode: "barcode",
      symbology: "microqr",
      payload: "MICRO-QRAFT",
      humanReadableText: false,
    });

    const rmqr = await exportQraftProject({
      mode: "barcode",
      symbology: "rmqr",
      payload: "Qraft narrow label",
      humanReadableText: false,
      rasterPixelSize: 1024,
    });
    await expect(importQraftProject(rmqr.blob)).resolves.toMatchObject({
      mode: "barcode",
      symbology: "rmqr",
      payload: "Qraft narrow label",
      humanReadableText: false,
    });
  });

  it("rejects invalid current payload and invalid barcode project state", async () => {
    const qr = await exportQraftProject({
      mode: "qr",
      payloadId: "url",
      input: "https://example.com",
      errorCorrectionLevel: "M",
      design: DEFAULT_QR_DESIGN,
      rasterPixelSize: 1024,
    });
    const rawQr = JSON.parse(await qr.blob.text()) as Record<string, unknown>;
    rawQr.content = { kind: "payload", payloadId: "url", input: "javascript:alert(1)" };
    await expect(
      importQraftProject(new Blob([JSON.stringify(rawQr)], { type: "application/json" })),
    ).rejects.toThrow(/payload is not valid/i);

    const barcode = await exportQraftProject({
      mode: "barcode",
      symbology: "datamatrix",
      payload: "valid",
      humanReadableText: false,
      rasterPixelSize: 1024,
    });
    const rawBarcode = JSON.parse(await barcode.blob.text()) as Record<string, unknown>;
    rawBarcode.code = { symbology: "datamatrix", humanReadableText: true };
    await expect(
      importQraftProject(new Blob([JSON.stringify(rawBarcode)], { type: "application/json" })),
    ).rejects.toThrow(/does not expose human-readable text/i);
  });
});
