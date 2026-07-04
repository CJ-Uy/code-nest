import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { auditLogs } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { createAuditRepository } from "./audit";
import { createLinksRepository } from "./links";

const owner: Actor = { memberId: "mem_owner", roles: ["member"] };
const other: Actor = { memberId: "mem_other", roles: ["member"] };
const moderator: Actor = { memberId: "mem_mod", roles: ["member", "link"] };

function repo() {
	const db = drizzle(env.DB, { schema });
	return createLinksRepository(db, createAuditRepository(db));
}

describe("links repository on D1", () => {
	beforeEach(async () => {
		await env.DB.batch([
			env.DB.prepare("DELETE FROM link_daily_stats"),
			env.DB.prepare("DELETE FROM short_links"),
			env.DB.prepare("DELETE FROM reserved_slugs"),
			env.DB.prepare("DELETE FROM audit_logs"),
			env.DB.prepare("DELETE FROM members"),
		]);
		await env.DB.batch([
			env.DB.prepare("INSERT INTO members (id, email, name) VALUES (?, ?, ?)").bind("mem_owner", "owner@example.com", "Owner"),
			env.DB.prepare("INSERT INTO members (id, email, name) VALUES (?, ?, ?)").bind("mem_other", "other@example.com", "Other"),
			env.DB.prepare("INSERT INTO members (id, email, name) VALUES (?, ?, ?)").bind("mem_mod", "mod@example.com", "Mod"),
			env.DB.prepare("INSERT INTO reserved_slugs (slug) VALUES (?)").bind("portal"),
		]);
	});

	it("creates an owned link, normalizes the slug, and audits", async () => {
		const repository = repo();
		const link = await repository.create(owner, { slug: "  /Promo-2026 ", destinationUrl: "https://example.com/x", title: "Promo" });
		expect(link.slug).toBe("promo-2026");
		expect(link.ownerMemberId).toBe("mem_owner");
		const [audit] = await drizzle(env.DB, { schema }).select().from(auditLogs);
		expect(audit).toMatchObject({ action: "link:create", category: "link", targetId: link.id });
	});

	it("rejects a reserved slug, a malformed slug, and a non-http destination", async () => {
		const repository = repo();
		await expect(repository.create(owner, { slug: "portal", destinationUrl: "https://e.com", title: "x" })).rejects.toThrow("reserved");
		await expect(repository.create(owner, { slug: "no", destinationUrl: "https://e.com", title: "x" })).rejects.toThrow("Invalid slug");
		await expect(repository.create(owner, { slug: "good-slug", destinationUrl: "javascript:alert(1)", title: "x" })).rejects.toThrow(
			"destination",
		);
	});

	it("rejects a duplicate slug", async () => {
		const repository = repo();
		await repository.create(owner, { slug: "welcome", destinationUrl: "https://e.com", title: "x" });
		await expect(repository.create(other, { slug: "welcome", destinationUrl: "https://e.com", title: "y" })).rejects.toThrow("taken");
	});

	it("forbids a non-owner without moderate from updating or deleting", async () => {
		const repository = repo();
		const link = await repository.create(owner, { slug: "welcome", destinationUrl: "https://e.com", title: "x" });
		await expect(repository.update(other, link.id, { title: "hijack" })).rejects.toThrow("Not authorized");
		await expect(repository.remove(other, link.id)).rejects.toThrow("Not authorized");
	});

	it("lets a moderator list all links and update any link", async () => {
		const repository = repo();
		const link = await repository.create(owner, { slug: "welcome", destinationUrl: "https://e.com", title: "x" });
		await expect(repository.update(moderator, link.id, { title: "moderated" })).resolves.toMatchObject({ title: "moderated" });
		const all = await repository.listAll(moderator, { limit: 10 });
		expect(all.map((l) => l.id)).toContain(link.id);
		await expect(repository.listAll(other, { limit: 10 })).rejects.toThrow("Not authorized");
	});

	it("lists visible links with owner data and saved tags", async () => {
		const repository = repo();
		const first = await repository.create(owner, { slug: "welcome", destinationUrl: "https://e.com", title: "Welcome", tags: ["event", "social"] });
		const second = await repository.create(other, { slug: "newsletter", destinationUrl: "https://e.com/news", title: "News" });

		const visible = await repository.listVisible(owner, { limit: 10 });
		expect(visible.map((link) => link.id).sort()).toEqual([first.id, second.id].sort());
		expect(visible.find((link) => link.id === first.id)).toMatchObject({ tags: ["event", "social"], owner: { id: "mem_owner", name: "Owner" } });
		expect(first.qrStyle.logoUrl).toBe("/code-falcon-transparent.svg");
	});

	it("round-trips tags and qr style on update", async () => {
		const repository = repo();
		const link = await repository.create(owner, { slug: "welcome", destinationUrl: "https://e.com", title: "x" });
		const updated = await repository.update(owner, link.id, {
			tags: ["crs"],
			qrStyle: { foreground: "#0C315C", background: "#FFFFFF", logoSize: 0.2, logoMargin: 4, logoUrl: "/logo.svg", showLogoBacking: false },
		});

		expect(updated.tags).toEqual(["crs"]);
		expect(updated.qrStyle).toMatchObject({ foreground: "#0C315C", logoUrl: "/logo.svg", showLogoBacking: false });
	});

	it("lets non-owners read link details and stats", async () => {
		const repository = repo();
		const link = await repository.create(owner, { slug: "welcome", destinationUrl: "https://e.com", title: "x" });
		await repository.recordClick(link.id, { date: "2026-06-19", referrerBucket: "direct", deviceBucket: "desktop" });

		await expect(repository.getById(other, link.id)).resolves.toMatchObject({ id: link.id });
		await expect(repository.getStats(other, link.id)).resolves.toMatchObject({ link: { id: link.id } });
	});

	it("resolves a slug for redirect and records a fail-open click upsert", async () => {
		const repository = repo();
		const link = await repository.create(owner, { slug: "welcome", destinationUrl: "https://e.com/dest", title: "x" });
		const resolved = await repository.resolveForRedirect("welcome");
		expect(resolved?.destinationUrl).toBe("https://e.com/dest");
		expect(await repository.resolveForRedirect("missing")).toBeNull();

		await repository.recordClick(link.id, { date: "2026-06-19", referrerBucket: "direct", deviceBucket: "desktop" });
		await repository.recordClick(link.id, { date: "2026-06-19", referrerBucket: "direct", deviceBucket: "desktop" });
		const stats = await repository.getStats(owner, link.id);
		expect(stats.series.find((d) => d.date === "2026-06-19")?.count).toBe(2);
		const [row] = await drizzle(env.DB, { schema }).select().from(schema.shortLinks);
		expect(row.clickCount).toBe(2);
	});
});
