import { describe, expect, it } from "vitest";

import { exportQraftProject } from "@/application/project/export-qraft-project";
import { importQraftProject } from "@/application/project/import-qraft-project";
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

describe("portable Qraft projects", () => {
  it("round-trips payload, design, ECC and export size without a logo", async () => {
    const artifact = await exportQraftProject({
      payloadId: "url",
      input: "openai.com/research",
      errorCorrectionLevel: "H",
      design: { ...DEFAULT_QR_DESIGN, moduleShape: "dots" },
      rasterPixelSize: 2048,
    });

    expect(artifact.filename).toBe("qraft-url.qraft.json");
    const imported = await importQraftProject(artifact.blob);
    expect(imported).toMatchObject({
      payloadId: "url",
      input: "openai.com/research",
      errorCorrectionLevel: "H",
      rasterPixelSize: 2048,
      design: { moduleShape: "dots" },
    });
    expect(imported.logo).toBeUndefined();
  });

  it("round-trips a Phase 3A structured payload through schema v1", async () => {
    const input = {
      latitude: "30.0444",
      longitude: "31.2357",
      altitude: "",
      uncertainty: "25",
    };
    const artifact = await exportQraftProject({
      payloadId: "location",
      input,
      errorCorrectionLevel: "M",
      design: DEFAULT_QR_DESIGN,
      rasterPixelSize: 1024,
    });

    const imported = await importQraftProject(artifact.blob);
    expect(imported).toMatchObject({ payloadId: "location", input });
  });

  it("round-trips an Event payload with persistent UID and revision metadata", async () => {
    const input = {
      title: "Qraft planning",
      allDay: false,
      startDate: "",
      endDate: "",
      startDateTime: "2026-09-02T14:00",
      endDateTime: "2026-09-02T15:00",
      timeMode: "utc",
      location: "Studio B",
      description: "Phase 3B event project",
      url: "https://example.com/qraft-event",
      uid: "urn:uuid:00000000-0000-4000-8000-000000000888",
      dtstamp: "20260829T123000Z",
    };
    const artifact = await exportQraftProject({
      payloadId: "event",
      input,
      errorCorrectionLevel: "M",
      design: DEFAULT_QR_DESIGN,
      rasterPixelSize: 1024,
    });

    const imported = await importQraftProject(artifact.blob);
    expect(imported).toMatchObject({ payloadId: "event", input });
  });

  it("round-trips an exact Raw payload without trimming or normalization", async () => {
    const input = {
      value: "  raw://example\r\nمرحبا 👋\n  ",
    };
    const artifact = await exportQraftProject({
      payloadId: "raw",
      input,
      errorCorrectionLevel: "Q",
      design: DEFAULT_QR_DESIGN,
      rasterPixelSize: 1024,
    });

    const imported = await importQraftProject(artifact.blob);
    expect(imported).toMatchObject({ payloadId: "raw", input });
  });

  it("round-trips an App Link payload without turning Qraft into a redirect service", async () => {
    const input = {
      strategy: "custom-scheme",
      destination: "qraftdemo://product/42?ref=portable-project",
    };
    const artifact = await exportQraftProject({
      payloadId: "app",
      input,
      errorCorrectionLevel: "M",
      design: DEFAULT_QR_DESIGN,
      rasterPixelSize: 1024,
    });

    const imported = await importQraftProject(artifact.blob);
    expect(imported).toMatchObject({ payloadId: "app", input });
  });

  it("round-trips a Social Link payload through the existing schema-v1 envelope", async () => {
    const input = {
      platform: "linkedin",
      target: "avery-morgan",
    };
    const artifact = await exportQraftProject({
      payloadId: "social",
      input,
      errorCorrectionLevel: "M",
      design: DEFAULT_QR_DESIGN,
      rasterPixelSize: 1024,
    });

    const imported = await importQraftProject(artifact.blob);
    expect(imported).toMatchObject({ payloadId: "social", input });
  });

  it("round-trips a bounded normalized PNG logo", async () => {
    const logoBytes = fakePngHeader();
    const design = {
      ...DEFAULT_QR_DESIGN,
      logo: { sizePercent: 20, paddingModules: 0.5 },
    } as const;
    const artifact = await exportQraftProject({
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
    expect(imported.design.logo).toEqual({ sizePercent: 20, paddingModules: 0.5 });
    expect(imported.logo).toMatchObject({
      name: "brand--logo.png",
      width: 256,
      height: 256,
    });
    expect(imported.logo?.blob.type).toBe("image/png");
    expect(imported.logo?.blob.size).toBe(logoBytes.byteLength);
  });

  it("rejects project payload content that no longer validates in the current codec", async () => {
    const artifact = await exportQraftProject({
      payloadId: "url",
      input: "https://example.com",
      errorCorrectionLevel: "M",
      design: DEFAULT_QR_DESIGN,
      rasterPixelSize: 1024,
    });
    const raw = JSON.parse(await artifact.blob.text()) as Record<string, unknown>;
    raw.payload = { id: "url", input: "javascript:alert(1)" };

    await expect(
      importQraftProject(new Blob([JSON.stringify(raw)], { type: "application/json" })),
    ).rejects.toThrow(/payload is not valid/i);
  });
});
