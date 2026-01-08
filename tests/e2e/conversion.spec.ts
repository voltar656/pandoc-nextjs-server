import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import { join } from "path";

// Check if pandoc is available
let pandocAvailable = false;
try {
  execSync("pandoc --version", { stdio: "ignore" });
  pandocAvailable = true;
} catch {
  pandocAvailable = false;
}

test.describe("Document Conversion Flow", () => {
  test("homepage loads correctly", async ({ page }) => {
    await page.goto("/");

    // Check header
    await expect(page.locator("text=Pandoc Server")).toBeVisible();

    // Check format selectors exist
    await expect(page.locator("text=Source file format")).toBeVisible();
    await expect(page.locator("text=Destination file format")).toBeVisible();

    // Check file upload area exists
    await expect(page.locator("text=Drop files here or click to browse")).toBeVisible();
  });

  test("can select source and destination formats", async ({ page }) => {
    await page.goto("/");

    // Select source format
    const sourceSelect = page.locator("select").first();
    await sourceSelect.selectOption("gfm");
    await expect(sourceSelect).toHaveValue("gfm");

    // Select destination format
    const destSelect = page.locator("select").nth(1);
    await destSelect.selectOption("pdf");
    await expect(destSelect).toHaveValue("pdf");
  });

  test("shows advanced options for markdown source", async ({ page }) => {
    await page.goto("/");

    // Default is markdown, should show advanced options
    await expect(page.locator("text=Advanced Options")).toBeVisible();
    await expect(page.locator("text=Table of Contents")).toBeVisible();
    await expect(page.locator("text=Numbered Sections")).toBeVisible();
  });

  test("hides advanced options for non-markdown source", async ({ page }) => {
    await page.goto("/");

    // Select HTML as source
    const sourceSelect = page.locator("select").first();
    await sourceSelect.selectOption("html");

    // Advanced options should be hidden
    await expect(page.locator("text=Advanced Options")).not.toBeVisible();
  });

  test("shows template option for docx output", async ({ page }) => {
    await page.goto("/");

    // Default dest is docx, should show template option
    await expect(page.locator("text=Template (optional)")).toBeVisible();
  });

  test("hides template option for non-docx output", async ({ page }) => {
    await page.goto("/");

    // Select PDF as destination
    const destSelect = page.locator("select").nth(1);
    await destSelect.selectOption("pdf");

    // Template option should be hidden
    await expect(page.locator("text=Template (optional)")).not.toBeVisible();
  });

  test("convert button is disabled without file", async ({ page }) => {
    await page.goto("/");

    const convertButton = page.locator("button", { hasText: "Convert" });
    await expect(convertButton).toBeDisabled();
  });

  test("can upload file and shows file info", async ({ page }) => {
    await page.goto("/");

    const testFilePath = join(process.cwd(), "tests/fixtures/sample.md");

    // Click on the upload area to trigger file chooser
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText("Drop files here or click to browse").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testFilePath);

    // Should show file name
    await expect(page.getByText("sample.md")).toBeVisible({ timeout: 10000 });

    // Convert button should be enabled
    const convertButton = page.locator("button", { hasText: "Convert" });
    await expect(convertButton).toBeEnabled();
  });

  test("can clear selected file", async ({ page }) => {
    await page.goto("/");

    const testFilePath = join(process.cwd(), "tests/fixtures/sample.md");

    // Click on the upload area to trigger file chooser
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText("Drop files here or click to browse").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testFilePath);

    // Wait for file to be shown
    await expect(page.getByText("sample.md")).toBeVisible({ timeout: 10000 });

    // Click change button
    await page.getByRole("button", { name: "Change" }).click();

    // Should show upload area again
    await expect(page.getByText("Drop files here or click to browse")).toBeVisible();
  });

  test("full conversion flow - markdown to HTML @requires-pandoc", async ({ page }) => {
    test.skip(!pandocAvailable, "pandoc not installed");

    await page.goto("/");

    // Set destination to HTML
    const destSelect = page.locator("select").nth(1);
    await destSelect.selectOption("html");

    // Upload file using file chooser
    const testFilePath = join(process.cwd(), "tests/fixtures/sample.md");
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText("Drop files here or click to browse").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testFilePath);

    // Wait for file to be shown
    await expect(page.getByText("sample.md")).toBeVisible({ timeout: 10000 });

    // Start waiting for download before clicking
    const downloadPromise = page.waitForEvent("download");

    // Click convert
    await page.locator("button", { hasText: "Convert" }).click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".html");
  });

  test("TOC option can be toggled", async ({ page }) => {
    await page.goto("/");

    // Find and click TOC checkbox
    const tocCheckbox = page
      .locator("text=Table of Contents")
      .locator("..")
      .locator('input[type="checkbox"]');
    await tocCheckbox.check();
    await expect(tocCheckbox).toBeChecked();

    // TOC depth selector should appear
    await expect(page.locator("text=TOC Depth")).toBeVisible();

    // Uncheck
    await tocCheckbox.uncheck();
    await expect(tocCheckbox).not.toBeChecked();
  });
});

test.describe("Health Check", () => {
  test("API health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    // Either 200 (pandoc available) or 503 (pandoc unavailable)
    expect([200, 503]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("pandoc");
    expect(["ok", "degraded"]).toContain(data.status);
  });

  test("API health returns ok when pandoc available @requires-pandoc", async ({ request }) => {
    test.skip(!pandocAvailable, "pandoc not installed");

    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.pandoc).toMatch(/^\d+\.\d+/);
  });
});
