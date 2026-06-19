import { z } from "zod";
import { createManualRetentionRecordInputSchema } from "@/db/types";
import { operation } from "./common";

export const retentionRecordOutputSchema = z.object({
	id: z.string(),
	memberId: z.string(),
	termId: z.string(),
	eventId: z.string().nullable(),
	points: z.number().int().nullable(),
	reason: z.string(),
	source: z.enum(["event_attendance", "manual"]),
	recordedBy: z.string(),
	recordedAt: z.coerce.date(),
});

export const retentionSummaryOutputSchema = z.object({
	totalPoints: z.number().int(),
	recordCount: z.number().int(),
	retainedAt: z.number().int(),
	probationBelow: z.number().int(),
	status: z.enum(["retained", "on_track", "probation"]),
});

export const leaderboardRowOutputSchema = z.object({
	memberId: z.string(),
	fullName: z.string().nullable(),
	name: z.string().nullable(),
	totalPoints: z.number().int(),
});

export const retentionContract = {
	listForMember: operation({
		input: z.object({
			memberId: z.string().min(1),
			termId: z.string().min(1),
			limit: z.number().int().min(1).max(100).default(50),
			offset: z.number().int().min(0).default(0),
		}),
		output: z.object({ records: z.array(retentionRecordOutputSchema) }),
		auth: "member",
		sharedDev: "allow",
	}),
	memberTermSummary: operation({
		input: z.object({ memberId: z.string().min(1), termId: z.string().min(1) }),
		output: z.object({ summary: retentionSummaryOutputSchema }),
		auth: "member",
		sharedDev: "allow",
	}),
	leaderboard: operation({
		input: z.object({
			termId: z.string().min(1),
			limit: z.number().int().min(1).max(100).default(50),
			offset: z.number().int().min(0).default(0),
		}),
		output: z.object({ rows: z.array(leaderboardRowOutputSchema) }),
		auth: "member",
		sharedDev: "allow",
	}),
	createManual: operation({
		input: createManualRetentionRecordInputSchema,
		output: z.object({ recordIds: z.array(z.string()) }),
		auth: "admin",
		permission: "retention:record",
		sharedDev: "deny",
	}),
};
