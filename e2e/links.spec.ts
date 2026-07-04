import { expect, test } from "@playwright/test";
import { signInAs } from "./fixtures/auth";

test("a member can create a short link and see it listed", async ({ page }) => {
	await signInAs(page, "member");
	await page.goto("/portal/links");
	await page.waitForTimeout(750);

	const slug = `e2e-${Date.now().toString(36)}`;
	await page.getByRole("button", { name: "New short link" }).click();
	await page.getByPlaceholder("welcome").fill(slug);
	await page.getByPlaceholder("https://example.com").fill("https://example.com/e2e-target");
	await page.getByPlaceholder("Welcome page").fill("E2E target");
	await page.getByRole("button", { name: /create link/i }).click();

	await expect(page.getByText(slug)).toBeVisible();
});
