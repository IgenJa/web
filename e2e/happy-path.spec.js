const { test, expect } = require("@playwright/test");

test("happy path: register -> login -> create post", async ({ page }) => {
  const email = `user_${Date.now()}@test.com`;
  const password = "password123";
  const title = `Playwright poszt ${Date.now()}`;

  await page.goto("/");

  // register
  await page.goto("/#/register");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Jelszó").fill(password);
  await page.getByRole("button", { name: "Regisztráció" }).click();

  // login
  await page.waitForURL(/#\/login/);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Jelszó").fill(password);
  await page.getByRole("button", { name: "Belépés" }).click();

  // create post (guarded route)
  await page.waitForURL(/#\/$/);
  await page.getByRole("link", { name: "Új poszt" }).click();
  await page.waitForURL(/#\/new/);

  await page.getByPlaceholder("A poszt címe").fill(title);
  await page.locator('select[name="category_id"]').selectOption({ value: "1" });
  await page.getByPlaceholder("Miről szeretnél írni?").fill("Ez egy E2E teszt által létrehozott poszt tartalma.");
  await page.getByRole("button", { name: "Közzététel" }).click();

  await page.waitForURL(/#\/$/);
  await expect(page.getByRole("heading", { name: title }).first()).toBeVisible();
});

