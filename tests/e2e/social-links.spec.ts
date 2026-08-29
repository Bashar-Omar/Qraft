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

test("Social Link helper builds curated profile URLs and keeps full links local", async ({
  page,
}) => {
  await page.goto("/generate");
  await clickPayloadType(page, /Social Link/);

  const platform = page.getByLabel("Platform");
  const target = page.getByLabel("Handle or profile/page URL");
  const inspector = page.locator(".payload-inspector");

  await platform.selectOption("x");
  await target.fill("@OpenAI");
  await expect(page.getByRole("img", { name: "Generated QR code preview" })).toBeVisible();
  await expect(inspector).toContainText("Social Link");
  await inspector.getByText("Raw encoded payload", { exact: true }).click();
  await expect(inspector.locator("pre")).toHaveText("https://x.com/OpenAI");

  await platform.selectOption("youtube");
  await target.fill("@قناة");
  await expect(inspector.locator("pre")).toHaveText(
    `https://www.youtube.com/@${encodeURIComponent("قناة")}`,
  );

  await platform.selectOption("linkedin");
  const linkedInUrl = "https://www.linkedin.com/in/avery-morgan?trk=qraft";
  await target.fill(linkedInUrl);
  await expect(inspector).toContainText("linkedin");
  await expect(inspector.locator("pre")).toHaveText(linkedInUrl);
  await expect(page).toHaveURL(/\/generate$/);

  const quality = page.locator(".quality-assistant");
  await quality.getByRole("button", { name: "Run self-test" }).click();
  await expect(quality.getByText("Passed local self-test", { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  const projectPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save .qraft.json" }).click();
  const project = await projectPromise;
  expect(project.suggestedFilename()).toBe("qraft-social.qraft.json");

  const projectBytes = await readDownloadBytes(project);
  const document = JSON.parse(projectBytes.toString("utf8")) as {
    payload?: { id?: string; input?: Record<string, unknown> };
  };
  expect(document.payload).toMatchObject({
    id: "social",
    input: {
      platform: "linkedin",
      target: linkedInUrl,
    },
  });
});
