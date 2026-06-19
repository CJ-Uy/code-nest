import { desc, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { InferSelectModel } from "drizzle-orm";
import * as schema from "@/db/schema";
import { linkDailyStats, reservedSlugs, shortLinks } from "@/db/schema";
import { createId } from "@/lib/ids";
import { isValidDestinationUrl, isValidSlugFormat, normalizeSlug, RESERVED_SLUG_DEFAULTS } from "@/lib/links";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { AuditRepository } from "./audit";
import { pageLimit } from "./types";

export type ShortLink = InferSelectModel<typeof shortLinks>;

export type CreateLinkInput = { slug: string; destinationUrl: string; title: string };
export type UpdateLinkInput = Partial<{
	destinationUrl: string;
	title: string;
	previewTitle: string | null;
	previewDescription: string | null;
	previewImageKey: string | null;
}>;
export type ResolvedLink = {
	id: string;
	slug: string;
	destinationUrl: string;
	title: string;
	previewTitle: string | null;
	previewDescription: string | null;
	previewImageKey: string | null;
};
export type LinkStats = {
	link: ShortLink;
	series: Array<{ date: string; count: number }>;
	referrers: Array<{ bucket: string; count: number }>;
	devices: Array<{ bucket: string; count: number }>;
};

export type LinksRepository = {
	listOwn(actor: Actor, input?: { limit?: number; offset?: number }): Promise<ShortLink[]>;
	listAll(actor: Actor, input?: { limit?: number; offset?: number }): Promise<ShortLink[]>;
	getById(actor: Actor, id: string): Promise<ShortLink | null>;
	create(actor: Actor, input: CreateLinkInput): Promise<ShortLink>;
	update(actor: Actor, id: string, input: UpdateLinkInput): Promise<ShortLink>;
	remove(actor: Actor, id: string): Promise<void>;
	getStats(actor: Actor, id: string): Promise<LinkStats>;
	resolveForRedirect(slug: string): Promise<ResolvedLink | null>;
	recordClick(linkId: string, input: { date: string; referrerBucket: string; deviceBucket: string }): Promise<void>;
};

export type LinkDb = DrizzleD1Database<typeof schema>;

async function loadOwned(db: LinkDb, actor: Actor, id: string): Promise<ShortLink> {
	const [link] = await db.select().from(shortLinks).where(eq(shortLinks.id, id)).limit(1);
	if (!link) throw new Error("Link not found.");
	if (link.ownerMemberId !== actor.memberId && !can(actor, "link:moderate")) {
		throw new Error("Not authorized to access this link.");
	}
	return link;
}

function ensurePage(input?: { limit?: number; offset?: number }) {
	return { limit: pageLimit(input?.limit), offset: input?.offset ?? 0 };
}

function sortedBuckets(map: Map<string, number>) {
	return Array.from(map.entries())
		.map(([key, count]) => ({ key, count }))
		.sort((a, b) => a.key.localeCompare(b.key));
}

export function createLinksRepository(db: LinkDb, audit: AuditRepository): LinksRepository {
	return {
		async listOwn(actor, input) {
			const page = ensurePage(input);
			return db
				.select()
				.from(shortLinks)
				.where(eq(shortLinks.ownerMemberId, actor.memberId))
				.orderBy(desc(shortLinks.createdAt))
				.limit(page.limit)
				.offset(page.offset);
		},

		async listAll(actor, input) {
			if (!can(actor, "link:moderate")) throw new Error("Not authorized to list all links.");
			const page = ensurePage(input);
			return db.select().from(shortLinks).orderBy(desc(shortLinks.createdAt)).limit(page.limit).offset(page.offset);
		},

		async getById(actor, id) {
			const [link] = await db.select().from(shortLinks).where(eq(shortLinks.id, id)).limit(1);
			if (!link) return null;
			if (link.ownerMemberId !== actor.memberId && !can(actor, "link:moderate")) {
				throw new Error("Not authorized to read this link.");
			}
			return link;
		},

		async create(actor, input) {
			const slug = normalizeSlug(input.slug);
			if (!isValidSlugFormat(slug)) throw new Error("Invalid slug format.");
			if (!isValidDestinationUrl(input.destinationUrl)) throw new Error("Invalid destination URL.");
			const title = input.title.trim();
			if (!title) throw new Error("A link title is required.");

			const defaultReserved: readonly string[] = RESERVED_SLUG_DEFAULTS;
			const [reserved] = await db.select().from(reservedSlugs).where(eq(reservedSlugs.slug, slug)).limit(1);
			if (defaultReserved.includes(slug) || reserved) throw new Error("That slug is reserved.");
			const [existing] = await db.select().from(shortLinks).where(eq(shortLinks.slug, slug)).limit(1);
			if (existing) throw new Error("That slug is already taken.");

			const [link] = await db
				.insert(shortLinks)
				.values({ id: createId("lnk"), slug, destinationUrl: input.destinationUrl, title, ownerMemberId: actor.memberId })
				.returning();
			await audit.record(actor, { action: "link:create", targetType: "link", targetId: link.id, category: "link" });
			return link;
		},

		async update(actor, id, input) {
			const current = await loadOwned(db, actor, id);
			const patch: UpdateLinkInput & { updatedAt: Date } = { updatedAt: new Date() };
			if (input.destinationUrl !== undefined) {
				if (!isValidDestinationUrl(input.destinationUrl)) throw new Error("Invalid destination URL.");
				patch.destinationUrl = input.destinationUrl;
			}
			if (input.title !== undefined) {
				const title = input.title.trim();
				if (!title) throw new Error("A link title is required.");
				patch.title = title;
			}
			if (input.previewTitle !== undefined) patch.previewTitle = input.previewTitle;
			if (input.previewDescription !== undefined) patch.previewDescription = input.previewDescription;
			if (input.previewImageKey !== undefined) patch.previewImageKey = input.previewImageKey;

			const [link] = await db.update(shortLinks).set(patch).where(eq(shortLinks.id, current.id)).returning();
			const moderated = current.ownerMemberId !== actor.memberId;
			await audit.record(actor, {
				action: moderated ? "link:moderate_update" : "link:update",
				targetType: "link",
				targetId: link.id,
				category: "link",
			});
			return link;
		},

		async remove(actor, id) {
			const current = await loadOwned(db, actor, id);
			await db.delete(shortLinks).where(eq(shortLinks.id, current.id));
			const moderated = current.ownerMemberId !== actor.memberId;
			await audit.record(actor, {
				action: moderated ? "link:moderate_delete" : "link:delete",
				targetType: "link",
				targetId: current.id,
				category: "link",
			});
		},

		async getStats(actor, id) {
			const link = await loadOwned(db, actor, id);
			const rows = await db.select().from(linkDailyStats).where(eq(linkDailyStats.linkId, link.id)).limit(2000);
			const byDate = new Map<string, number>();
			const byReferrer = new Map<string, number>();
			const byDevice = new Map<string, number>();
			for (const row of rows) {
				byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.count);
				byReferrer.set(row.referrerBucket, (byReferrer.get(row.referrerBucket) ?? 0) + row.count);
				byDevice.set(row.deviceBucket, (byDevice.get(row.deviceBucket) ?? 0) + row.count);
			}
			return {
				link,
				series: sortedBuckets(byDate).map(({ key, count }) => ({ date: key, count })),
				referrers: sortedBuckets(byReferrer).map(({ key, count }) => ({ bucket: key, count })),
				devices: sortedBuckets(byDevice).map(({ key, count }) => ({ bucket: key, count })),
			};
		},

		async resolveForRedirect(slug) {
			const [link] = await db
				.select({
					id: shortLinks.id,
					slug: shortLinks.slug,
					destinationUrl: shortLinks.destinationUrl,
					title: shortLinks.title,
					previewTitle: shortLinks.previewTitle,
					previewDescription: shortLinks.previewDescription,
					previewImageKey: shortLinks.previewImageKey,
				})
				.from(shortLinks)
				.where(eq(shortLinks.slug, normalizeSlug(slug)))
				.limit(1);
			return link ?? null;
		},

		async recordClick(linkId, input) {
			await db
				.insert(linkDailyStats)
				.values({ linkId, date: input.date, referrerBucket: input.referrerBucket, deviceBucket: input.deviceBucket, count: 1 })
				.onConflictDoUpdate({
					target: [linkDailyStats.linkId, linkDailyStats.date, linkDailyStats.referrerBucket, linkDailyStats.deviceBucket],
					set: { count: sql`${linkDailyStats.count} + 1` },
				});
			await db.update(shortLinks).set({ clickCount: sql`${shortLinks.clickCount} + 1` }).where(eq(shortLinks.id, linkId));
		},
	};
}

export function createUnavailableLinksRepository(): LinksRepository {
	const unavailable = async () => {
		throw new Error("Links are unavailable through this repository adapter.");
	};
	return {
		listOwn: unavailable,
		listAll: unavailable,
		getById: unavailable,
		create: unavailable,
		update: unavailable,
		remove: unavailable,
		getStats: unavailable,
		resolveForRedirect: unavailable,
		recordClick: unavailable,
	};
}
