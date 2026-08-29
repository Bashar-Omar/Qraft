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

test("Core QR landing and Generate studio are reachable", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Craft codes that work." })).toBeVisible();
  await expect(page.getByText("02D / EXPORT + PROJECTS", { exact: true })).toBeVisible();

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

test("Quality Assistant self-tests every shipped preset and surfaces design risk", async ({
  page,
}) => {
  await page.goto("/generate");

  const quality = page.locator(".quality-assistant");
  await expect(quality.getByText("GOOD", { exact: true })).toBeVisible();
  await expect(quality).toContainText("STRONG · 21.00:1");

  for (const preset of ["Pure Mono", "Qraft Mint", "Soft Mint", "Packaging"]) {
    await page.getByRole("button", { name: new RegExp(preset) }).click();
    await quality.getByRole("button", { name: "Run self-test" }).click();
    await expect(quality.getByText("Passed local self-test", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
  }

  await page.getByRole("button", { name: /Pure Mono/ }).click();
  await page.getByLabel("Module color").fill("#0fbf8f");

  await expect(quality.getByText("RISK", { exact: true })).toBeVisible();
  await expect(quality.getByText("Low visual contrast", { exact: true })).toBeVisible();
});

test("Local logo upload stays browser-only, embeds safely, and self-tests the final artifact", async ({
  page,
}) => {
  await page.goto("/generate");

  const logoInput = page.getByLabel("Logo image");
  await logoInput.setInputFiles({
    name: "unsafe.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
  });
  await expect(page.getByText(/Use a real PNG, JPEG or WebP image/)).toBeVisible();

  await logoInput.setInputFiles({
    name: "qraft-logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAAKElEQVR4nGPk39//n2EAAdNAWj7qgFEHjDpg1AGjDhh1wKgDGBgYGACItwJ8cuH6owAAAABJRU5ErkJggg==",
      "base64",
    ),
  });

  await expect(page.getByText("LOGO READY", { exact: true })).toBeVisible();
  await expect(page.getByText("qraft-logo.png", { exact: true })).toBeVisible();
  await expect(page.locator(".preview-meta")).toContainText("QR / DESIGNER");

  const quality = page.locator(".quality-assistant");
  await expect(quality).toContainText("20% SIDE · ~4.0% CENTER");
  await expect(
    quality.getByText("Branded QR benefits from stronger ECC", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Apply conservative settings" }).click();
  await expect(
    page
      .getByRole("group", { name: "Error correction" })
      .getByRole("button", { name: /^Q Quartile ~25%$/ }),
  ).toHaveAttribute("aria-pressed", "true");

  await quality.getByRole("button", { name: "Run self-test" }).click();
  await expect(quality.getByText("Passed local self-test", { exact: true })).toBeVisible({
    timeout: 15_000,
  });

  const svgDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download SVG" }).click();
  const svgDownload = await svgDownloadPromise;
  const stream = await svgDownload.createReadStream();
  let svg = "";
  for await (const chunk of stream) {
    svg += chunk.toString();
  }

  expect(svg).toContain("data:image/png;base64,");
  expect(svg).not.toContain("blob:");

  await page.getByRole("button", { name: "Remove logo" }).click();
  await expect(page.getByText("Choose logo", { exact: true })).toBeVisible();
  await expect(page.locator(".preview-meta")).toContainText("QR / STANDARD");
});

test("Raster export produces real PNG, JPEG and WebP artifacts at the selected size", async ({
  page,
}) => {
  await page.goto("/generate");
  await page.getByRole("checkbox", { name: /Transparent background/ }).check();
  await expect(page.locator(".preview-meta")).toContainText("QR / DESIGNER");
  await page.getByLabel("Raster size").selectOption("512");

  const pngPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const png = await pngPromise;
  const pngBytes = await readDownloadBytes(png);
  expect(png.suggestedFilename()).toBe("qraft-url.png");
  expect([...pngBytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const jpegPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JPEG" }).click();
  const jpeg = await jpegPromise;
  const jpegBytes = await readDownloadBytes(jpeg);
  expect(jpeg.suggestedFilename()).toBe("qraft-url.jpg");
  expect([...jpegBytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);

  const webpPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download WebP" }).click();
  const webp = await webpPromise;
  const webpBytes = await readDownloadBytes(webp);
  expect(webp.suggestedFilename()).toBe("qraft-url.webp");
  expect(webpBytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(webpBytes.subarray(8, 12).toString("ascii")).toBe("WEBP");

  const cornerPixels = await page.evaluate(
    async ({
      pngData,
      jpegData,
      webpData,
    }: {
      pngData: string;
      jpegData: string;
      webpData: string;
    }) => {
      async function corner(data: string, type: string) {
        const binary = atob(data);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes], { type }));
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable in raster artifact test.");
        context.drawImage(bitmap, 0, 0);
        const pixel = [...context.getImageData(0, 0, 1, 1).data];
        bitmap.close();
        return pixel;
      }

      return {
        png: await corner(pngData, "image/png"),
        jpeg: await corner(jpegData, "image/jpeg"),
        webp: await corner(webpData, "image/webp"),
      };
    },
    {
      pngData: pngBytes.toString("base64"),
      jpegData: jpegBytes.toString("base64"),
      webpData: webpBytes.toString("base64"),
    },
  );

  expect(cornerPixels.png[3]).toBe(0);
  expect(cornerPixels.webp[3]).toBe(0);
  expect(cornerPixels.jpeg.slice(0, 3).every((channel: number) => channel >= 250)).toBe(true);
  expect(cornerPixels.jpeg[3]).toBe(255);
});

test("Portable project export and import restores the validated studio state", async ({ page }) => {
  await page.goto("/generate");

  await clickPayloadType(page, /Text/);
  await page.getByLabel("Text").fill("Qraft project — مرحبًا 👋");
  await page.getByRole("button", { name: /Qraft Mint/ }).click();
  await page
    .getByRole("group", { name: "Error correction" })
    .getByRole("button", { name: /^H High ~30%$/ })
    .click();
  await page.getByLabel("Raster size").selectOption("2048");

  const savePromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save .qraft.json" }).click();
  const projectDownload = await savePromise;
  expect(projectDownload.suggestedFilename()).toBe("qraft-text.qraft.json");
  const projectBytes = await readDownloadBytes(projectDownload);
  const project = JSON.parse(projectBytes.toString("utf8")) as Record<string, unknown>;
  expect(project).toMatchObject({ kind: "qraft-project", schemaVersion: 1 });

  await clickPayloadType(page, /URL/);
  await page.getByRole("button", { name: /Pure Mono/ }).click();
  await page
    .getByRole("group", { name: "Error correction" })
    .getByRole("button", { name: /^L Low ~7%$/ })
    .click();
  await page.getByLabel("Raster size").selectOption("512");

  await page.getByLabel("Open Qraft project").setInputFiles({
    name: "restored.qraft.json",
    mimeType: "application/json",
    buffer: projectBytes,
  });

  await expect(
    page.getByText("Opened restored.qraft.json locally.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Text")).toHaveValue("Qraft project — مرحبًا 👋");
  await expect(page.getByRole("button", { name: /Qraft Mint/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page
      .getByRole("group", { name: "Error correction" })
      .getByRole("button", { name: /^H High ~30%$/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Raster size")).toHaveValue("2048");
  await expect(page.getByRole("img", { name: "Generated QR code preview" })).toBeVisible();
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
