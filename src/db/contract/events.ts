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
};
