import { z } from "zod";
import { createMemberInputSchema } from "@/db/types";
import { operation } from "./common";

export const memberOutputSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	name: z.string().nullable(),
});

export const membersContract = {
	list: operation({
		input: z.object({ limit: z.number().int().min(1).max(50).default(25) }),
		output: z.object({ members: z.array(memberOutputSchema) }),
		auth: "admin",
		permission: "member:manage",
		sharedDev: "allow",
	}),
	create: operation({
		input: createMemberInputSchema,
		output: z.object({ member: memberOutputSchema }),
		auth: "admin",
		permission: "member:manage",
		sharedDev: "deny",
	}),
};
