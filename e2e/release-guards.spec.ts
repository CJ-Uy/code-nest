import { expect, request, test, type Page } from "@playwright/test";
import { signInAs } from "./fixtures/auth";

const BASE_URL = "http://127.0.0.1:3101";
const memberRoutes = [
	"/portal/events",
	"/portal/library",
	"/portal/library/lists",
	"/portal/announcements",
	"/portal/notifications",
	"/portal/surveys/missing",
];
const adminRoutes = [
	"/portal/admin/content/library",
	"/portal/admin/content/announcements",
	"/portal/admin/content/surveys",
];
const publicRoutes = ["/contact", "/product", "/projects", "/services"];

async function expectNotFound(page: Page, route: string): Promise<void> {
	const response = await page.goto(route);
	expect(response, `${route} did not return a navigation response`).not.toBeNull();
	expect(response?.status(), route).toBe(404);
}

test("deferred member and public routes return 404", async ({ page }) => {
	await signInAs(page, "member");
	for (const route of memberRoutes) await expectNotFound(page, route);
	for (const route of publicRoutes) await expectNotFound(page, route);
});

test("member navigation excludes deferred modules", async ({ page }) => {
	await signInAs(page, "member");
	for (const label of ["Retention", "Library", "Announcements", "Notifications"])
		await expect(page.getByRole("link", { name: label, exact: true })).toHaveCount(0);
	await expect(page.getByRole("link", { name: "Link shortener", exact: true })).not.toHaveCount(0);
});

test("deferred admin routes return 404", async ({ page }) => {
	await signInAs(page, "admin");
	for (const route of adminRoutes) await expectNotFound(page, route);
});

test("admin navigation excludes deferred content modules", async ({ page }) => {
	await signInAs(page, "admin");
	await page.goto("/portal/admin");
	for (const label of ["Library", "Announcements", "Surveys"])
		await expect(page.getByRole("link", { name: label, exact: true })).toHaveCount(0);
	for (const label of [
		"Member List",
		"Roles & Access",
		"Short Links",
		"Pinned Nav Links",
		"Dashboard Shortcuts",
		"Activity Log",
		"Events",
		"Point Types",
	])
		await expect(page.getByRole("link", { name: label, exact: true })).not.toHaveCount(0);
});

test("root and seeded short links keep their redirects", async () => {
	const api = await request.newContext({ baseURL: BASE_URL, maxRedirects: 0 });
	try {
		const root = await api.get("/");
		expect(root.status()).toBeGreaterThanOrEqual(300);
		expect(root.status()).toBeLessThan(400);
		expect(root.headers()["location"]).toBe("https://sites.google.com/view/ateneo-code/landing");

		const welcome = await api.get("/welcome");
		expect(welcome.status()).toBeGreaterThanOrEqual(300);
		expect(welcome.status()).toBeLessThan(400);
		expect(welcome.headers()["location"]).toBe("https://example.com/code");
	} finally {
		await api.dispose();
	}
});

test("disabled APIs return 404 before validation", async () => {
	const api = await request.newContext({ baseURL: BASE_URL });
	try {
		for (const route of ["/api/surveys/submit", "/api/contact", "/api/articles/missing/feedback"])
			expect((await api.post(route)).status(), route).toBe(404);
	} finally {
		await api.dispose();
	}
});
