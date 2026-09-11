import { expect, test } from "@playwright/test";

test("home page shows the primary hero and navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("img", { name: /thai temples under a clear blue sky/i })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Map" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Get in Touch" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("main")).toHaveAttribute("id", "main-content");
});

test("home feature cards navigate to the explore module", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /travel across thailand/i }).click();
  await expect(page).toHaveURL(/\/explore$/);
  await expect(page.getByRole("heading", { name: /explore map is next/i })).toBeVisible();
});

test("primary nav reaches independent modules", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Blog" })
    .click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("heading", { name: /blog is coming soon/i })).toBeVisible();
});

test("unknown routes render the not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
});

test("document responses include a nonce content security policy", async ({ page }) => {
  const response = await page.goto("/");
  const csp = response?.headers()["content-security-policy"] ?? "";

  expect(csp).toContain("nonce-");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toContain("unsafe-inline");
});

test("skip link and contact module stay reachable from home chrome", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /skip to content/i })).toHaveAttribute(
    "href",
    "#main-content",
  );
  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "Get in Touch" })
    .click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(
    page.getByRole("heading", { name: /contact is coming soon/i }),
  ).toBeVisible();
});

test("home captures review screenshots at key widths", async ({ page }) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("img", { name: /thai temples under a clear blue sky/i })).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  }
});
