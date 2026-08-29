import { expect, test, type Download, type Page } from "@playwright/test";

async function clickPayloadType(page: Page, name: RegExp) {
  const viewportWidth = page.viewportSize()?.width ?? 1280;
  const picker =
    viewportWidth <= 1050 ? page.locator(".studio-mobile-types") : page.locator(".type-list");
  const button = picker.getByRole("button", { name });

  await expect(button).toBeVisible();
  await button.click();
}

async function readDownloadBytes(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

test("App Link helper keeps verified HTTPS and custom app schemes local and explicit", async ({
  page,
}) => {
  await page.goto("/generate");
  await clickPayloadType(page, /App Link/);

  const destination = page.getByLabel("App link destination");
  const strategy = page.getByLabel("Link strategy");
  const inspector = page.locator(".payload-inspector");

  await destination.fill("https://example.com/app/products/42?source=qraft");
  await expect(page.getByRole("img", { name: "Generated QR code preview" })).toBeVisible();
  await expect(inspector).toContainText("App Link");
  await expect(inspector).toContainText("example.com");
  await expect(
    page.getByText(/Qraft validates the URL locally but cannot verify that platform association/),
  ).toBeVisible();

  const quality = page.locator(".quality-assistant");
  await quality.getByRole("button", { name: "Run self-test" }).click();
  await expect(quality.getByText("Passed local self-test", { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  const projectPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save .qraft.json" }).click();
  const project = await projectPromise;
  expect(project.suggestedFilename()).toBe("qraft-app.qraft.json");

  const projectBytes = await readDownloadBytes(project);
  const document = JSON.parse(projectBytes.toString("utf8")) as {
    payload?: { id?: string; input?: Record<string, unknown> };
  };
  expect(document.payload).toMatchObject({
    id: "app",
    input: {
      strategy: "https",
      destination: "https://example.com/app/products/42?source=qraft",
    },
  });

  await strategy.selectOption("custom-scheme");
  await destination.fill("qraftdemo://product/42?ref=qr");

  await expect(inspector).toContainText("App Link");
  await inspector.getByText("Raw encoded payload", { exact: true }).click();
  await expect(inspector.locator("pre")).toHaveText("qraftdemo://product/42?ref=qr");
  await expect(
    page.getByText(/Custom schemes can collide with other apps and do not provide/),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/generate$/);
});
