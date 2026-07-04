import { desc, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { InferSelectModel } from "drizzle-orm";
import * as schema from "@/db/schema";
import { linkDailyStats, members, reservedSlugs, shortLinks } from "@/db/schema";
import { createId } from "@/lib/ids";
import { isValidDestinationUrl, isValidSlugFormat, normalizeSlug, RESERVED_SLUG_DEFAULTS } from "@/lib/links";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { AuditRepository } from "./audit";
import { pageLimit } from "./types";

export type ShortLink = InferSelectModel<typeof shortLinks>;
export type LinkOwner = { id: string; name: string | null; image: string | null };
export type QrStyle = {
	foreground: string;
	background: string;
	logoUrl: string | null;
	logoSize: number;
	logoMargin: number;
	showLogoBacking: boolean;
};
export type LinkListItem = Omit<ShortLink, "tags" | "qrStyle"> & { owner: LinkOwner | null; tags: string[]; qrStyle: QrStyle };

export const DEFAULT_QR_STYLE: QrStyle = {
	foreground: "#06192F",
	background: "#FFFFFF",
	logoUrl: "/code-falcon-transparent.svg",
	logoSize: 0.28,
	logoMargin: 8,
	showLogoBacking: true,
};

export type CreateLinkInput = { slug: string; destinationUrl: string; title: string; tags?: string[]; qrStyle?: Partial<QrStyle> };
export type UpdateLinkInput = Partial<{
	destinationUrl: string;
	title: string;
	previewTitle: string | null;
	previewDescription: string | null;
	previewImageKey: string | null;
	tags: string[];
	qrStyle: Partial<QrStyle>;
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
	listVisible(actor: Actor, input?: { limit?: number; offset?: number }): Promise<LinkListItem[]>;
	listOwn(actor: Actor, input?: { limit?: number; offset?: number }): Promise<LinkListItem[]>;
	listAll(actor: Actor, input?: { limit?: number; offset?: number }): Promise<LinkListItem[]>;
	getById(actor: Actor, id: string): Promise<ShortLink | null>;
	create(actor: Actor, input: CreateLinkInput): Promise<LinkListItem>;
	update(actor: Actor, id: string, input: UpdateLinkInput): Promise<LinkListItem>;
	remove(actor: Actor, id: string): Promise<void>;
	getStats(actor: Actor, id: string): Promise<LinkStats>;
	resolveForRedirect(slug: string): Promise<ResolvedLink | null>;
	recordClick(linkId: string, input: { date: string; referrerBucket: string; deviceBucket: string }): Promise<void>;
};

export type LinkDb = DrizzleD1Database<typeof schema>;
export type LinkErrorCode = "not_found" | "not_authorized" | "validation";

export class LinkRepositoryError extends Error {
	constructor(
		readonly code: LinkErrorCode,
		message: string,
	) {
		super(message);
		this.name = "LinkRepositoryError";
	}
}

export function linkErrorStatus(error: unknown): number {
	if (!(error instanceof LinkRepositoryError)) return 400;
	if (error.code === "not_authorized") return 403;
	if (error.code === "not_found") return 404;
	return 400;
}

function linkError(code: LinkErrorCode, message: string): LinkRepositoryError {
	return new LinkRepositoryError(code, message);
}

async function loadReadable(db: LinkDb, id: string): Promise<ShortLink> {
	const [link] = await db.select().from(shortLinks).where(eq(shortLinks.id, id)).limit(1);
	if (!link) throw linkError("not_found", "Link not found.");
	return link;
}

async function loadOwned(db: LinkDb, actor: Actor, id: string): Promise<ShortLink> {
	const link = await loadReadable(db, id);
	if (link.ownerMemberId !== actor.memberId && !can(actor, "link:moderate")) {
		throw linkError("not_authorized", "Not authorized to access this link.");
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
function parseTags(value: string | null): string[] {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value) as unknown;
		return Array.isArray(parsed) ? validateTags(parsed.filter((tag): tag is string => typeof tag === "string")) : [];
	} catch {
		return [];
	}
}

function validateTags(input: string[] = []): string[] {
	const tags = Array.from(new Set(input.map((tag) => tag.trim()).filter(Boolean)));
	if (tags.length > 10 || tags.some((tag) => tag.length > 24)) throw linkError("validation", "Tags must be 1 to 24 characters, max 10 tags.");
	return tags;
}

function validHex(value: string): boolean {
	return /^#[0-9a-f]{6}$/i.test(value);
}

function validateQrStyle(input?: Partial<QrStyle>): QrStyle {
	const style = { ...DEFAULT_QR_STYLE, ...(input ?? {}) };
	if (!validHex(style.foreground) || !validHex(style.background)) throw linkError("validation", "QR colors must be hex values.");
	if (style.logoSize < 0.1 || style.logoSize > 0.35) throw linkError("validation", "QR logo size is out of range.");
	if (style.logoMargin < 0 || style.logoMargin > 24) throw linkError("validation", "QR logo margin is out of range.");
	if (style.logoUrl && !style.logoUrl.startsWith("/") && !/^https?:\/\//i.test(style.logoUrl)) throw linkError("validation", "QR logo URL is invalid.");
	return style;
}

function parseQrStyle(value: string | null): QrStyle {
	if (!value) return DEFAULT_QR_STYLE;
	try {
		return validateQrStyle(JSON.parse(value) as Partial<QrStyle>);
	} catch {
		return DEFAULT_QR_STYLE;
	}
}

function rowToListItem(row: { link: ShortLink; owner: LinkOwner | null }): LinkListItem {
	return { ...row.link, owner: row.owner, tags: parseTags(row.link.tags), qrStyle: parseQrStyle(row.link.qrStyle) };
}

async function enrichLink(db: LinkDb, link: ShortLink): Promise<LinkListItem> {
	const [row] = await db
		.select({ link: shortLinks, owner: { id: members.id, name: members.name, image: members.image } })
		.from(shortLinks)
		.leftJoin(members, eq(members.id, shortLinks.ownerMemberId))
		.where(eq(shortLinks.id, link.id))
		.limit(1);
	return rowToListItem(row ?? { link, owner: null });
}

function listQuery(db: LinkDb) {
	return db.select({ link: shortLinks, owner: { id: members.id, name: members.name, image: members.image } }).from(shortLinks).leftJoin(members, eq(members.id, shortLinks.ownerMemberId));
}

export function createLinksRepository(db: LinkDb, audit: AuditRepository): LinksRepository {
	return {
		async listVisible(actor, input) {
			void actor;
			const page = ensurePage(input);
			const rows = await listQuery(db).orderBy(desc(shortLinks.createdAt)).limit(page.limit).offset(page.offset);
			return rows.map(rowToListItem);
		},

		async listOwn(actor, input) {
			const page = ensurePage(input);
			const rows = await listQuery(db)
				.where(eq(shortLinks.ownerMemberId, actor.memberId))
				.orderBy(desc(shortLinks.createdAt))
				.limit(page.limit)
				.offset(page.offset);
			return rows.map(rowToListItem);
		},

		async listAll(actor, input) {
			if (!can(actor, "link:moderate")) throw linkError("not_authorized", "Not authorized to list all links.");
			const page = ensurePage(input);
			const rows = await listQuery(db).orderBy(desc(shortLinks.createdAt)).limit(page.limit).offset(page.offset);
			return rows.map(rowToListItem);
		},

		async getById(actor, id) {
			void actor;
			const [link] = await db.select().from(shortLinks).where(eq(shortLinks.id, id)).limit(1);
			return link ?? null;
		},

		async create(actor, input) {
			const slug = normalizeSlug(input.slug);
			if (!isValidSlugFormat(slug)) throw linkError("validation", "Invalid slug format.");
			if (!isValidDestinationUrl(input.destinationUrl)) throw linkError("validation", "Invalid destination URL.");
			const title = input.title.trim();
			if (!title) throw linkError("validation", "A link title is required.");

			const defaultReserved: readonly string[] = RESERVED_SLUG_DEFAULTS;
			const [reserved] = await db.select().from(reservedSlugs).where(eq(reservedSlugs.slug, slug)).limit(1);
			if (defaultReserved.includes(slug) || reserved) throw linkError("validation", "That slug is reserved.");
			const [existing] = await db.select().from(shortLinks).where(eq(shortLinks.slug, slug)).limit(1);
			if (existing) throw linkError("validation", "That slug is already taken.");

			const tags = validateTags(input.tags);
			const qrStyle = validateQrStyle(input.qrStyle);
			const [link] = await db
				.insert(shortLinks)
				.values({ id: createId("lnk"), slug, destinationUrl: input.destinationUrl, title, ownerMemberId: actor.memberId, tags: JSON.stringify(tags), qrStyle: JSON.stringify(qrStyle) })
				.returning();
			await audit.record(actor, { action: "link:create", targetType: "link", targetId: link.id, category: "link" });
			return enrichLink(db, link);
		},

		async update(actor, id, input) {
			const current = await loadOwned(db, actor, id);
			const patch: Partial<ShortLink> & { updatedAt: Date } = { updatedAt: new Date() };
			if (input.destinationUrl !== undefined) {
				if (!isValidDestinationUrl(input.destinationUrl)) throw linkError("validation", "Invalid destination URL.");
				patch.destinationUrl = input.destinationUrl;
			}
			if (input.title !== undefined) {
				const title = input.title.trim();
				if (!title) throw linkError("validation", "A link title is required.");
				patch.title = title;
			}
			if (input.previewTitle !== undefined) patch.previewTitle = input.previewTitle;
			if (input.previewDescription !== undefined) patch.previewDescription = input.previewDescription;
			if (input.previewImageKey !== undefined) patch.previewImageKey = input.previewImageKey;
			if (input.tags !== undefined) patch.tags = JSON.stringify(validateTags(input.tags));
			if (input.qrStyle !== undefined) patch.qrStyle = JSON.stringify(validateQrStyle(input.qrStyle));

			const [link] = await db.update(shortLinks).set(patch).where(eq(shortLinks.id, current.id)).returning();
			const moderated = current.ownerMemberId !== actor.memberId;
			await audit.record(actor, {
				action: moderated ? "link:moderate_update" : "link:update",
				targetType: "link",
				targetId: link.id,
				category: "link",
			});
			return enrichLink(db, link);
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
			void actor;
			const link = await loadReadable(db, id);
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
		listVisible: unavailable,
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
