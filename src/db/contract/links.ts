import { z } from "zod";
import { operation } from "./common";

export const qrStyleSchema = z.object({
	foreground: z.string().regex(/^#[0-9a-f]{6}$/i),
	background: z.string().regex(/^#[0-9a-f]{6}$/i),
	logoUrl: z.string().nullable(),
	logoSize: z.number().min(0.1).max(0.35),
	logoMargin: z.number().min(0).max(24),
	showLogoBacking: z.boolean(),
});

export const linkOutputSchema = z.object({
	id: z.string(),
	slug: z.string(),
	destinationUrl: z.string(),
	title: z.string(),
	ownerMemberId: z.string(),
	clickCount: z.number().int(),
	previewTitle: z.string().nullable(),
	previewDescription: z.string().nullable(),
	previewImageKey: z.string().nullable(),
	tags: z.string().nullable(),
	qrStyle: z.string().nullable(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});

export const linkOwnerSchema = z.object({ id: z.string(), name: z.string().nullable(), image: z.string().nullable() });
export const linkListItemSchema = linkOutputSchema.omit({ tags: true, qrStyle: true }).extend({
	owner: linkOwnerSchema.nullable(),
	tags: z.array(z.string()),
	qrStyle: qrStyleSchema,
});

const tagsInputSchema = z.array(z.string().trim().min(1).max(24)).max(10);
const qrStyleInputSchema = qrStyleSchema.partial();

export const createLinkInputSchema = z.object({
	slug: z.string().trim().min(1).max(64),
	destinationUrl: z.string().trim().url().max(2048),
	title: z.string().trim().min(1).max(120),
	tags: tagsInputSchema.optional(),
	qrStyle: qrStyleInputSchema.optional(),
});

export const updateLinkInputSchema = z.object({
	id: z.string().min(1),
	destinationUrl: z.string().trim().url().max(2048).optional(),
	title: z.string().trim().min(1).max(120).optional(),
	previewTitle: z.string().trim().max(120).nullable().optional(),
	previewDescription: z.string().trim().max(300).nullable().optional(),
	previewImageKey: z.string().trim().max(256).nullable().optional(),
	tags: tagsInputSchema.optional(),
	qrStyle: qrStyleInputSchema.optional(),
});

export const linkStatsOutputSchema = z.object({
	link: linkOutputSchema,
	series: z.array(z.object({ date: z.string(), count: z.number().int() })),
	referrers: z.array(z.object({ bucket: z.string(), count: z.number().int() })),
	devices: z.array(z.object({ bucket: z.string(), count: z.number().int() })),
});

const pageInput = z.object({
	limit: z.number().int().min(1).max(50).default(25),
	offset: z.number().int().min(0).default(0),
});

export const linksContract = {
	listVisible: operation({
		input: pageInput,
		output: z.object({ links: z.array(linkListItemSchema) }),
		auth: "member",
		sharedDev: "allow",
	}),
	listOwn: operation({
		input: pageInput,
		output: z.object({ links: z.array(linkListItemSchema) }),
		auth: "member",
		sharedDev: "allow",
	}),
	listAll: operation({
		input: pageInput,
		output: z.object({ links: z.array(linkListItemSchema) }),
		auth: "admin",
		permission: "link:moderate",
		sharedDev: "allow",
	}),
	get: operation({
		input: z.object({ id: z.string().min(1) }),
		output: z.object({ link: linkOutputSchema.nullable() }),
		auth: "member",
		sharedDev: "allow",
	}),
	create: operation({
		input: createLinkInputSchema,
		output: z.object({ link: linkListItemSchema }),
		auth: "member",
		sharedDev: "deny",
	}),
	update: operation({
		input: updateLinkInputSchema,
		output: z.object({ link: linkListItemSchema }),
		auth: "member",
		sharedDev: "deny",
	}),
	remove: operation({
		input: z.object({ id: z.string().min(1) }),
		output: z.object({}),
		auth: "member",
		sharedDev: "deny",
	}),
	stats: operation({
		input: z.object({ id: z.string().min(1) }),
		output: linkStatsOutputSchema,
		auth: "member",
		sharedDev: "allow",
	}),
};
