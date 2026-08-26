import { expect, test, type Page } from "@playwright/test";
async function clickPayloadType(page: Page, name: RegExp) {
  const viewportWidth = page.viewportSize()?.width ?? 1280;
  const picker =
    viewportWidth <= 1050 ? page.locator(".studio-mobile-types") : page.locator(".type-list");
  const button = picker.getByRole("button", { name });

  await expect(button).toBeVisible();
  await button.click();
}

test("Core QR landing and Generate studio are reachable", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Craft codes that work." })).toBeVisible();
  await expect(page.getByText("02A / VISUAL STUDIO", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Open QR studio" }).click();

  await expect(page).toHaveURL(/\/generate$/);
  await expect(page.getByTestId("studio-shell")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Build a code, not a compromise." }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "Generated QR code preview" })).toBeVisible();
});

test("URL generation normalizes locally and exports SVG and PNG", async ({ page }) => {
  await page.goto("/generate");

  const urlInput = page.getByLabel("Destination");
  await urlInput.fill("openai.com/research");

  await expect(
    page.getByText("Qraft added https:// to produce a complete URL payload."),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "Generated QR code preview" })).toBeVisible();

  const svgDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  const svgDownload = await svgDownloadPromise;
  expect(svgDownload.suggestedFilename()).toBe("qraft-url.svg");

  const pngDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toBe("qraft-url.png");
});

test("Text payload and ECC controls update the live QR", async ({ page }) => {
  await page.goto("/generate");

  await clickPayloadType(page, /Text/);
  const textInput = page.getByLabel("Text");
  await textInput.fill("Qraft — مرحبًا 👋");
  const highEcc = page
    .getByRole("group", { name: "Error correction" })
    .getByRole("button", { name: /^H High ~30%$/ });
  await highEcc.click();

  await expect(textInput).toHaveValue("Qraft — مرحبًا 👋");
  await expect(highEcc).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("img", { name: "Generated QR code preview" })).toBeVisible();
  await expect(page.locator(".preview-meta")).toContainText("H");
});

test("Email, Phone, SMS and Wi-Fi editors generate through the shared pipeline", async ({
  page,
}) => {
  await page.goto("/generate");

  await clickPayloadType(page, /Email/);
  await page.getByLabel("Recipients").fill("hello@example.com");
  await page.getByLabel("Subject").fill("Qraft hello");
  await page.getByLabel("Email body").fill("Generated locally");
  await expect(page.getByRole("img", { name: "Generated QR code preview" })).toBeVisible();

  await clickPayloadType(page, /Phone/);
  await page.getByLabel("Phone number").fill("+1 (202) 555-0123");
  await expect(page.getByLabel("Phone number")).toHaveValue("+1 (202) 555-0123");

  await clickPayloadType(page, /^SMS/);
  await page.getByLabel("Recipient number").fill("+1 202 555 0123");
  await page.getByLabel("SMS message").fill("Hello from Qraft");
  await expect(page.getByLabel("SMS message")).toHaveValue("Hello from Qraft");

  await clickPayloadType(page, /Wi-Fi/);
  await page.getByLabel("Network name (SSID)").fill("Qraft;Lab");
  await page.getByLabel("Password").fill("example:only");
  await page.getByLabel("Hidden network").check();

  const wifiSvgDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  const wifiSvgDownload = await wifiSvgDownloadPromise;
  expect(wifiSvgDownload.suggestedFilename()).toBe("qraft-wifi.svg");
});

test("Designer controls update the canonical SVG and PNG artifacts", async ({ page }) => {
  await page.goto("/generate");

  await clickPayloadType(page, /Text/);
  await page.getByLabel("Text").fill("Qraft — مرحبًا 👋");

  const qraftMint = page.getByRole("button", { name: /Qraft Mint/ });
  await qraftMint.click();
  await expect(qraftMint).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("Module shape").selectOption("dots");
  await page.getByRole("button", { name: "Gradient", exact: true }).click();
  await page.getByLabel("Gradient start color").fill("#04120d");
  await page.getByLabel("Gradient end color").fill("#0b6b55");
  await page.getByRole("button", { name: "90°" }).click();
  await page.getByRole("checkbox", { name: /Transparent background/ }).check();

  await expect(page.getByRole("img", { name: "Generated QR code preview" })).toBeVisible();
  await expect(page.locator(".preview-meta")).toContainText("QR / DESIGNER");

  const svgDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  const svgDownload = await svgDownloadPromise;
  expect(svgDownload.suggestedFilename()).toBe("qraft-text.svg");

  const pngDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const pngDownload = await pngDownloadPromise;
  expect(pngDownload.suggestedFilename()).toBe("qraft-text.png");
});

test("theme selector persists the chosen preference", async ({ page }) => {
  await page.goto("/");

  const group = page.getByLabel("Color theme");
  const dark = group.getByRole("button", { name: "dark" });
  const light = group.getByRole("button", { name: "light" });

  await expect(group).toBeVisible();

  await dark.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");

  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByLabel("Color theme").getByRole("button", { name: "dark" }),
  ).toHaveAttribute("aria-pressed", "true");

  await light.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(light).toHaveAttribute("aria-pressed", "true");
});
