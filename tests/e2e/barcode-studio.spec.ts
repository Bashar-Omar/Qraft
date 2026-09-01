import { expect, test, type Download, type Page } from "@playwright/test";

async function readDownloadBytes(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function openBarcodeStudio(page: Page) {
  await page.getByRole("tab", { name: /Barcode Studio/ }).click();
  await expect(page.getByTestId("barcode-studio-shell")).toBeVisible();
}

async function chooseBarcode(page: Page, name: RegExp) {
  const studio = page.getByTestId("barcode-studio-shell");
  const viewportWidth = page.viewportSize()?.width ?? 1280;
  const picker =
    viewportWidth <= 1050 ? studio.locator(".studio-mobile-types") : studio.locator(".type-list");
  const button = picker.getByRole("button", { name });
  await expect(button).toBeVisible();
  await button.click();
}

test("Code 128 renders, independently self-tests and exports rectangular artifacts", async ({
  page,
}) => {
  await page.goto("/generate");

  const qrStudio = page.locator(".studio-shell:visible");
  const qrSaveButton = qrStudio.getByRole("button", { name: "Save .qraft.json" });
  await expect(qrSaveButton).toBeEnabled();
  const qrProjectPromise = page.waitForEvent("download");
  await qrSaveButton.click();
  const qrProjectBytes = await readDownloadBytes(await qrProjectPromise);

  await openBarcodeStudio(page);

  const studio = page.getByTestId("barcode-studio-shell");
  const content = studio.getByLabel("Barcode content");
  await content.fill("QRAFT-CODE128-2026");

  await expect(page.getByRole("img", { name: "Generated Code 128 barcode preview" })).toBeVisible();
  await expect(studio.locator(".preview-meta")).toContainText("CODE 128 / BWIP");
  await expect(studio.getByLabel("Human-readable text")).toBeChecked();
  await expect(studio.getByLabel("Barcode capabilities")).toContainText("HRT · YES");
  await expect(studio.getByLabel("Barcode capabilities")).toContainText("LOGO · NO");

  const quality = studio.locator(".quality-assistant");
  await quality.getByRole("button", { name: "Run self-test" }).click();
  await expect(quality.getByText("Passed independent local decode", { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  const svgPromise = page.waitForEvent("download");
  await studio.getByRole("button", { name: "Download SVG" }).click();
  const svg = await svgPromise;
  expect(svg.suggestedFilename()).toBe("qraft-code128.svg");
  const svgText = (await readDownloadBytes(svg)).toString("utf8");
  expect(svgText).toContain("<svg");
  expect(svgText).toMatch(/viewBox="0 0 \d+ \d+"/);

  const projectPromise = page.waitForEvent("download");
  await studio.getByRole("button", { name: "Save .qraft.json" }).click();
  const project = await projectPromise;
  expect(project.suggestedFilename()).toBe("qraft-code128.qraft.json");
  const projectBytes = await readDownloadBytes(project);
  const document = JSON.parse(projectBytes.toString("utf8")) as {
    schemaVersion?: number;
    content?: { kind?: string; value?: string };
    code?: { symbology?: string; humanReadableText?: boolean };
  };
  expect(document).toMatchObject({
    schemaVersion: 2,
    content: { kind: "barcode", value: "QRAFT-CODE128-2026" },
    code: { symbology: "code128", humanReadableText: true },
  });

  await page.getByRole("tab", { name: /QR Studio/ }).click();
  const visibleQrStudio = page.locator(".studio-shell:visible");
  await visibleQrStudio.getByLabel("Open Qraft project").setInputFiles({
    name: "saved-code128.qraft.json",
    mimeType: "application/json",
    buffer: projectBytes,
  });

  await expect(page.getByRole("tab", { name: /Barcode Studio/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByTestId("barcode-studio-shell").getByLabel("Barcode content")).toHaveValue(
    "QRAFT-CODE128-2026",
  );

  await page.getByTestId("barcode-studio-shell").getByLabel("Open Qraft project").setInputFiles({
    name: "legacy-qr-workspace.qraft.json",
    mimeType: "application/json",
    buffer: qrProjectBytes,
  });
  await expect(page.getByRole("tab", { name: /QR Studio/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("tabpanel", { name: /QR Studio/ }).getByLabel("Destination", { exact: true }),
  ).toBeVisible();
});

test("Data Matrix exposes only applicable capabilities and rejects unsupported Unicode honestly", async ({
  page,
}) => {
  await page.goto("/generate");
  await openBarcodeStudio(page);
  await chooseBarcode(page, /Data Matrix/);

  const studio = page.getByTestId("barcode-studio-shell");
  const content = studio.getByLabel("Barcode content");
  await content.fill("Lot-Ä-42");

  await expect(
    page.getByRole("img", { name: "Generated Data Matrix barcode preview" }),
  ).toBeVisible();
  await expect(studio.getByLabel("Human-readable text")).toHaveCount(0);
  await expect(studio.getByLabel("Barcode capabilities")).toContainText("HRT · NO");
  await expect(studio.locator(".preview-meta")).toContainText("DATA MATRIX / BWIP");

  const quality = studio.locator(".quality-assistant");
  await quality.getByRole("button", { name: "Run self-test" }).click();
  await expect(quality.getByText("Passed independent local decode", { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  await content.fill("مرحبا");
  await expect(
    studio.getByRole("status").filter({ hasText: /ISO-8859-1 \/ Latin-1 bytes only/ }),
  ).toBeVisible();
  await expect(studio.getByRole("button", { name: "Download SVG" })).toBeDisabled();
});

test("curated linear and retail formats validate before rendering and self-test canonical GTIN data", async ({
  page,
}) => {
  await page.goto("/generate");
  await openBarcodeStudio(page);

  const studio = page.getByTestId("barcode-studio-shell");
  const content = studio.getByLabel("Barcode content");

  await chooseBarcode(page, /Code 39/);
  await content.fill("QRAFT-39");
  await expect(page.getByRole("img", { name: "Generated Code 39 barcode preview" })).toBeVisible();

  await chooseBarcode(page, /Interleaved 2 of 5/);
  await content.fill("12345");
  await expect(studio.getByRole("status").filter({ hasText: /even number of digits/i })).toBeVisible();
  await expect(studio.getByRole("button", { name: "Download SVG" })).toBeDisabled();
  await content.fill("0123456789");
  await expect(
    page.getByRole("img", { name: "Generated Interleaved 2 of 5 barcode preview" }),
  ).toBeVisible();

  await chooseBarcode(page, /EAN-13/);
  await content.fill("952012345678");
  await expect(
    studio.getByRole("status").filter({ hasText: /CHECK DIGIT · 8 · COMPUTED.*9520123456788/i }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "Generated EAN-13 barcode preview" })).toBeVisible();

  const quality = studio.locator(".quality-assistant");
  await quality.getByRole("button", { name: "Run self-test" }).click();
  await expect(quality.getByText("Passed independent local decode", { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  const projectPromise = page.waitForEvent("download");
  await studio.getByRole("button", { name: "Save .qraft.json" }).click();
  const project = await projectPromise;
  expect(project.suggestedFilename()).toBe("qraft-ean13.qraft.json");
  const projectDocument = JSON.parse((await readDownloadBytes(project)).toString("utf8")) as {
    content?: { value?: string };
    code?: { symbology?: string };
  };
  expect(projectDocument).toMatchObject({
    content: { value: "9520123456788" },
    code: { symbology: "ean13" },
  });

  await content.fill("9520123456780");
  await expect(studio.getByRole("status").filter({ hasText: /Expected 8/i })).toBeVisible();
  await expect(studio.getByRole("button", { name: "Download SVG" })).toBeDisabled();
});
