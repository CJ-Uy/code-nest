import { expect, test } from "@playwright/test";
import { signInAs } from "./fixtures/auth";

test("an admin records attendance via the scan fallback", async ({ page }) => {
	await signInAs(page, "admin");
	await page.goto("/portal/calendar/evt_e2e_scan");

	await expect(page.getByRole("heading", { name: "E2E live scan event" })).toBeVisible();
	await expect(page.getByText(/check-in is open/i)).toBeVisible();
	await page.getByPlaceholder("Search a member to check in…").fill("member@example.com");
	const member = page.getByRole("button", { name: /demo member (mark present|present)/i });
	await expect(member).toBeVisible();
	await member.click();

	await expect(page.getByText("Checked in Demo Member.", { exact: true })).toBeVisible();
});
