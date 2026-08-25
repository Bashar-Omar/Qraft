import { expect, test } from "@playwright/test";

test("Core QR landing and Generate studio are reachable", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Craft codes that work." })).toBeVisible();
  await expect(page.getByText("CORE QR / LIVE")).toBeVisible();

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

  const viewportWidth = page.viewportSize()?.width ?? 1280;
  const typePicker =
    viewportWidth <= 1050 ? page.locator(".studio-mobile-types") : page.locator(".type-list");

  await typePicker.getByRole("button", { name: /Text/ }).click();
  const textInput = page.getByLabel("Text");
  await textInput.fill("Qraft — مرحبًا 👋");
  await page.getByRole("button", { name: /High/ }).click();

  await expect(textInput).toHaveValue("Qraft — مرحبًا 👋");
  await expect(page.getByRole("button", { name: /High/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("img", { name: "Generated QR code preview" })).toBeVisible();
  await expect(page.locator(".preview-meta")).toContainText("H");
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
