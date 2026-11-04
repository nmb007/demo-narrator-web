import path from "node:path";

import { expect, test } from "@playwright/test";

import { seedUser } from "./support/seed-user";

test.describe("upload @fast", () => {
  test("blocks a .txt file on the client", async ({ page }) => {
    const email = `upload-${Date.now()}@example.com`;
    await seedUser(email, "password123");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/videos$/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Your videos" }),
    ).toBeVisible();

    await page.goto("/videos/upload");
    await expect(
      page.getByRole("heading", { name: "Upload video" }),
    ).toBeVisible();

    await page
      .getByLabel("Video file")
      .setInputFiles(path.join(process.cwd(), "e2e/fixtures/invalid.txt"));
    await page.getByRole("button", { name: "Upload video" }).click();
    await expect(page.getByText("Use a .mov or .mp4 file.")).toBeVisible();
    await expect(page).toHaveURL(/\/videos\/upload$/);
  });
});
