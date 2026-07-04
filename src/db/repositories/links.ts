import { desc, eq, sql } from "drizzle-orm";
import { linkDailyStats, members, reservedSlugs, shortLinks } from "@/db/schema";
import { createId } from "@/lib/ids";
import { isValidDestinationUrl, isValidSlugFormat, normalizeSlug, RESERVED_SLUG_DEFAULTS } from "@/lib/links";
import type { PublicShortLink, ShortLinkVisit } from "@/server/short-links";
import type { Actor } from "@/server/auth/permissions";
import type { getDb } from "../client";

export type LinksDb = ReturnType<typeof getDb>;
export type LinkOwner = { id: string; name: string | null; email: string };
export type LinkListItem = typeof shortLinks.$inferSelect & { owner: LinkOwner | null };
export type CreateLinkInput = { slug: string; destinationUrl: string; title: string };

export type LinksRepository = {
	findBySlug(slug: string): Promise<PublicShortLink | null>;
	recordVisit(id: string, visit: ShortLinkVisit): Promise<void>;
	listVisible(actor: Actor, input?: { limit?: number; offset?: number }): Promise<LinkListItem[]>;
	create(actor: Actor, input: CreateLinkInput): Promise<LinkListItem>;
};

function page(input?: { limit?: number; offset?: number }) {
	return { limit: Math.min(Math.max(input?.limit ?? 50, 1), 100), offset: Math.max(input?.offset ?? 0, 0) };
}

function listQuery(db: LinksDb) {
	return db.select().from(shortLinks).leftJoin(members, eq(members.id, shortLinks.ownerMemberId));
}

function rowToListItem(row: { short_links: typeof shortLinks.$inferSelect; members: typeof members.$inferSelect | null }): LinkListItem {
	const owner = row.members ? { id: row.members.id, name: row.members.name, email: row.members.email } : null;
	return { ...row.short_links, owner };
}

export function createLinksRepository(db: LinksDb): LinksRepository {
	return {
		async findBySlug(slug) {
			const [link] = await db
				.select()
				.from(shortLinks)
				.where(eq(shortLinks.slug, slug))
				.limit(1);
			return link
				? {
						id: link.id,
						slug: link.slug,
						destinationUrl: link.destinationUrl,
					}
				: null;
		},
		async recordVisit(id, visit) {
			await db
				.update(shortLinks)
				.set({
					clickCount: sql`${shortLinks.clickCount} + 1`,
					updatedAt: new Date(),
				})
				.where(eq(shortLinks.id, id));
			await db
				.insert(linkDailyStats)
				.values({
					linkId: id,
					date: visit.date,
					referrerBucket: visit.referrerBucket,
					deviceBucket: visit.deviceBucket,
					count: 1,
				})
				.onConflictDoUpdate({
					target: [
						linkDailyStats.linkId,
						linkDailyStats.date,
						linkDailyStats.referrerBucket,
						linkDailyStats.deviceBucket,
					],
					set: { count: sql`${linkDailyStats.count} + 1` },
				});
		},
		async listVisible(_actor, input) {
			const paging = page(input);
			const rows = await listQuery(db)
				.orderBy(desc(shortLinks.createdAt))
				.limit(paging.limit)
				.offset(paging.offset);
			return rows.map(rowToListItem);
		},
		async create(actor, input) {
			const slug = normalizeSlug(input.slug);
			const title = input.title.trim();
			if (!title) throw new Error("A link title is required.");
			if (!isValidSlugFormat(slug)) throw new Error("Invalid slug format.");
			if (!isValidDestinationUrl(input.destinationUrl)) throw new Error("Invalid destination URL.");
			if (RESERVED_SLUG_DEFAULTS.includes(slug as (typeof RESERVED_SLUG_DEFAULTS)[number])) throw new Error("That slug is reserved.");

			const [reserved] = await db.select().from(reservedSlugs).where(eq(reservedSlugs.slug, slug)).limit(1);
			if (reserved) throw new Error("That slug is reserved.");
			const [existing] = await db.select().from(shortLinks).where(eq(shortLinks.slug, slug)).limit(1);
			if (existing) throw new Error("That slug is already taken.");

			const [link] = await db
				.insert(shortLinks)
				.values({ id: createId("lnk"), slug, destinationUrl: input.destinationUrl, title, ownerMemberId: actor.memberId })
				.returning();
			const [row] = await listQuery(db).where(eq(shortLinks.id, link.id)).limit(1);
			return row ? rowToListItem(row) : { ...link, owner: null };
		},
	};
}

export function createUnavailableLinksRepository(): LinksRepository {
	return {
		async findBySlug() {
			throw new Error("Short links are unavailable in shared mode.");
		},
		async recordVisit() {
			throw new Error("Short links are unavailable in shared mode.");
		},
		async listVisible() {
			throw new Error("Short links are unavailable in shared mode.");
		},
		async create() {
			throw new Error("Short links are unavailable in shared mode.");
		},
	};
}
