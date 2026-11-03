import { expect, test } from "@playwright/test";

import { seedUser } from "./support/seed-user";

test.describe("signup @fast", () => {
  test("creates an account, shows the placeholder, and logs out", async ({
    page,
  }) => {
    const email = `signup-${Date.now()}@example.com`;
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: "You speak, We narrate." }),
    ).toBeVisible();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("shows a taken email on the email field", async ({ page }) => {
    const email = `taken-${Date.now()}@example.com`;
    await seedUser(email, "password123");

    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByText("An account with this email already exists."),
    ).toBeVisible();
  });

  test("blocks a short password before it is sent", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("short@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Use at least 8 characters.")).toBeVisible();
  });
});
