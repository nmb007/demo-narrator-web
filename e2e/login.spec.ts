import { expect, test } from "@playwright/test";

import { seedUser } from "./support/seed-user";

test.describe("login @fast", () => {
  test("sends a signed-out visitor to login, then back after they sign in", async ({
    page,
  }) => {
    const email = `login-${Date.now()}@example.com`;
    await seedUser(email, "password123");

    await page.goto("/");
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(page.getByText("Your session expired.")).toHaveCount(0);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page).toHaveURL(/\/home$/);
  });

  test("shows an error for a wrong password", async ({ page }) => {
    const email = `login-bad-${Date.now()}@example.com`;
    await seedUser(email, "password123");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(
      page.getByText("The email or password is incorrect."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("shows an expired notice for a stored token that has expired", async ({
    page,
  }) => {
    const token = expiredToken();
    await page.addInitScript((value) => {
      localStorage.setItem("dn.session", JSON.stringify({ token: value }));
    }, token);
    await page.goto("/home");
    await expect(page).toHaveURL(/reason=expired/);
    await expect(page).toHaveURL(/next=/);
    await expect(page.getByText("Your session expired.")).toBeVisible();
  });
});

function expiredToken(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      sub: "user-1",
      email: "expired@example.com",
      exp: Math.floor(Date.now() / 1000) - 60,
    }),
  ).toString("base64url");
  return `${header}.${body}.sig`;
}
