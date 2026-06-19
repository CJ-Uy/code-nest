import { z } from "zod";
import { operation } from "./common";

export const eventOutputSchema = z.object({
	id: z.string(),
	title: z.string(),
	type: z.enum(["official", "casual", "birthday"]),
	status: z.enum(["pending", "approved", "rejected"]),
	points: z.number().int().nullable(),
	place: z.string(),
	capacity: z.number().int().nullable(),
	startsAt: z.coerce.date(),
	endsAt: z.coerce.date().nullable(),
	description: z.string(),
	createdBy: z.string(),
	approvedBy: z.string().nullable(),
	approvedAt: z.coerce.date().nullable(),
	createdAt: z.coerce.date(),
});

export const attendanceOutputSchema = z.object({
	memberId: z.string(),
	fullName: z.string().nullable(),
	name: z.string().nullable(),
	scannedAt: z.coerce.date(),
	scannedBy: z.string(),
});

const forumAuthorOutputSchema = z.object({
	memberId: z.string(),
	fullName: z.string().nullable(),
	name: z.string().nullable(),
});

export const forumPostOutputSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	parentId: z.string().nullable(),
	body: z.string(),
	anonymous: z.boolean(),
	createdAt: z.coerce.date(),
	author: forumAuthorOutputSchema.nullable(),
});

export const mediaOutputSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	r2Key: z.string(),
	caption: z.string().nullable(),
	uploadedBy: z.string(),
	createdAt: z.coerce.date(),
});

export const createEventInputSchema = z.object({
	title: z.string().trim().min(1).max(160),
	type: z.enum(["official", "casual", "birthday"]),
	place: z.string().trim().min(1).max(160),
	description: z.string().trim().min(1).max(4000),
	startsAt: z.coerce.date(),
	endsAt: z.coerce.date().nullable().default(null),
	points: z.number().int().min(-100).max(100).nullable().default(null),
	capacity: z.number().int().min(1).max(100000).nullable().default(null),
});

export const postForumInputSchema = z.object({
	eventId: z.string().min(1),
	body: z.string().trim().min(1).max(4000),
	anonymous: z.boolean().default(false),
	parentId: z.string().min(1).nullable().default(null),
});

export const addMediaInputSchema = z.object({
	eventId: z.string().min(1),
	r2Key: z.string().min(1).max(512),
	caption: z.string().trim().max(280).nullable().default(null),
});

export const eventsContract = {
	listApproved: operation({
		input: z.object({
			limit: z.number().int().min(1).max(100).default(50),
			offset: z.number().int().min(0).default(0),
		}),
		output: z.object({ events: z.array(eventOutputSchema) }),
		auth: "member",
		sharedDev: "allow",
	}),
	create: operation({
		input: createEventInputSchema,
		output: z.object({ event: eventOutputSchema }),
		auth: "admin",
		permission: "event:approve",
		sharedDev: "deny",
	}),
	approve: operation({
		input: z.object({ eventId: z.string().min(1) }),
		output: z.object({ event: eventOutputSchema }),
		auth: "admin",
		permission: "event:approve",
		sharedDev: "deny",
	}),
	rsvp: operation({
		input: z.object({ eventId: z.string().min(1), state: z.enum(["going", "none"]) }),
		output: z.object({ state: z.enum(["going", "none"]) }),
		auth: "member",
		sharedDev: "allow",
	}),
	scan: operation({
		input: z.object({ eventId: z.string().min(1), memberId: z.string().min(1), termId: z.string().min(1) }),
		output: z.object({
			eventId: z.string(),
			memberId: z.string(),
			scannedAt: z.coerce.date(),
			alreadyPresent: z.boolean(),
		}),
		auth: "admin",
		permission: "points:assign",
		sharedDev: "deny",
	}),
	searchMembers: operation({
		input: z.object({
			eventId: z.string().min(1),
			query: z.string().trim().min(1).max(120),
			limit: z.number().int().min(1).max(50).default(20),
		}),
		output: z.object({
			members: z.array(
				z.object({
					memberId: z.string(),
					fullName: z.string().nullable(),
					name: z.string().nullable(),
					email: z.string(),
					alreadyScanned: z.boolean(),
				}),
			),
		}),
		auth: "admin",
		permission: "points:assign",
		sharedDev: "allow",
	}),
	listAttendance: operation({
		input: z.object({ eventId: z.string().min(1) }),
		output: z.object({ attendance: z.array(attendanceOutputSchema) }),
		auth: "admin",
		permission: "points:assign",
		sharedDev: "allow",
	}),
	post: operation({
		input: postForumInputSchema,
		output: z.object({ post: forumPostOutputSchema }),
		auth: "member",
		sharedDev: "allow",
	}),
	listForumPosts: operation({
		input: z.object({
			eventId: z.string().min(1),
			limit: z.number().int().min(1).max(100).default(100),
			offset: z.number().int().min(0).default(0),
		}),
		output: z.object({ posts: z.array(forumPostOutputSchema) }),
		auth: "member",
		sharedDev: "allow",
	}),
	revealAuthor: operation({
		input: z.object({ postId: z.string().min(1) }),
		output: z.object({ author: forumAuthorOutputSchema }),
		auth: "admin",
		permission: "member:manage",
		sharedDev: "deny",
	}),
	addMedia: operation({
		input: addMediaInputSchema,
		output: z.object({ media: mediaOutputSchema }),
		auth: "admin",
		permission: "event:approve",
		sharedDev: "deny",
	}),
	listMedia: operation({
		input: z.object({ eventId: z.string().min(1) }),
		output: z.object({ media: z.array(mediaOutputSchema) }),
		auth: "member",
		sharedDev: "allow",
	}),
};
