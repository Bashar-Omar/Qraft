import { expect, test, type Page } from "@playwright/test";

async function clickPayloadType(page: Page, name: RegExp) {
  const viewportWidth = page.viewportSize()?.width ?? 1280;
  const picker =
    viewportWidth <= 1050 ? page.locator(".studio-mobile-types") : page.locator(".type-list");
  const button = picker.getByRole("button", { name });

  await expect(button).toBeVisible();
  await button.click();
}

test("Payload inspector exposes explicit privacy-preserving web actions and keeps custom schemes copy-only", async ({
  page,
}) => {
  await page.goto("/generate");

  const inspector = page.locator(".payload-inspector");
  const openDestination = inspector.getByRole("link", { name: "Open destination" });

  await page.getByLabel("Destination", { exact: true }).fill("https://example.com/docs?q=qraft");
  await expect(inspector.getByText("KNOWN INTENT", { exact: true })).toBeVisible();
  await expect(inspector.getByLabel("Destination metadata")).toContainText("HTTPS");
  await expect(inspector.getByLabel("Destination metadata")).toContainText("example.com");
  await expect(openDestination).toHaveAttribute("href", "https://example.com/docs?q=qraft");
  await expect(openDestination).toHaveAttribute("target", "_blank");
  await expect(openDestination).toHaveAttribute("rel", "noopener noreferrer");
  await expect(openDestination).toHaveAttribute("referrerpolicy", "no-referrer");
  await expect(page).toHaveURL(/\/generate$/);

  await clickPayloadType(page, /App Link/);
  await page.getByLabel("Link strategy").selectOption("custom-scheme");
  await page.getByLabel("App link destination").fill("qraftdemo://product/42?ref=qr");

  await expect(inspector.getByLabel("Destination metadata")).toContainText("QRAFTDEMO");
  await expect(inspector.getByLabel("Destination metadata")).toContainText("COPY ONLY");
  await expect(openDestination).toHaveCount(0);
  await expect(inspector.getByLabel("Inspection notices")).toContainText(
    "Custom app schemes are not verified by Qraft",
  );
  await expect(page).toHaveURL(/\/generate$/);

  await clickPayloadType(page, /Social Link/);
  await page.getByLabel("Platform").selectOption("x");
  await page.getByLabel("Handle or profile/page URL").fill("@OpenAI");

  await expect(openDestination).toHaveAttribute("href", "https://x.com/OpenAI");
  await expect(inspector.getByLabel("Destination metadata")).toContainText("x.com");
  await expect(page).toHaveURL(/\/generate$/);
});
