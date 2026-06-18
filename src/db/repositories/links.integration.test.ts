import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { linkDailyStats, members, shortLinks } from "@/db/schema";
import { createLinksRepository } from "./links";

const db = drizzle(env.DB, { schema });
const links = createLinksRepository(db);

beforeEach(async () => {
	await db.delete(linkDailyStats);
	await db.delete(shortLinks);
	await db.delete(members);
	await db.insert(members).values({
		id: "mem_owner",
		email: "owner@example.com",
		name: "Owner",
	});
	await db.insert(shortLinks).values({
		id: "lnk_welcome",
		slug: "welcome",
		destinationUrl: "https://example.com/welcome",
		title: "Welcome",
		ownerMemberId: "mem_owner",
	});
});

describe("links repository", () => {
	it("finds an exact short-link slug", async () => {
		await expect(links.findBySlug("welcome")).resolves.toMatchObject({
			id: "lnk_welcome",
			slug: "welcome",
			destinationUrl: "https://example.com/welcome",
		});
		await expect(links.findBySlug("Welcome")).resolves.toBeNull();
		await expect(links.findBySlug("missing")).resolves.toBeNull();
	});

	it("increments the total and inserts the daily bucket", async () => {
		await links.recordVisit("lnk_welcome", {
			date: "2026-06-18",
			referrerBucket: "direct",
			deviceBucket: "desktop",
		});

		const [link] = await db.select().from(shortLinks);
		const [daily] = await db.select().from(linkDailyStats);
		expect(link.clickCount).toBe(1);
		expect(daily).toMatchObject({
			linkId: "lnk_welcome",
			date: "2026-06-18",
			referrerBucket: "direct",
			deviceBucket: "desktop",
			count: 1,
		});
	});

	it("upserts repeated visits into the same daily bucket", async () => {
		const visit = {
			date: "2026-06-18",
			referrerBucket: "external" as const,
			deviceBucket: "mobile" as const,
		};

		await links.recordVisit("lnk_welcome", visit);
		await links.recordVisit("lnk_welcome", visit);

		const [link] = await db.select().from(shortLinks);
		const [daily] = await db.select().from(linkDailyStats);
		expect(link.clickCount).toBe(2);
		expect(daily.count).toBe(2);
	});
});
