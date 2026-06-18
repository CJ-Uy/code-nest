import { eq, sql } from "drizzle-orm";
import { linkDailyStats, shortLinks } from "@/db/schema";
import type { PublicShortLink, ShortLinkVisit } from "@/server/short-links";
import type { getDb } from "../client";

export type LinksDb = ReturnType<typeof getDb>;

export type LinksRepository = {
	findBySlug(slug: string): Promise<PublicShortLink | null>;
	recordVisit(id: string, visit: ShortLinkVisit): Promise<void>;
};

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
	};
}
