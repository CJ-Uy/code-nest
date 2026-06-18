import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import type { members } from "./schema";

export type Member = InferSelectModel<typeof members>;
export type NewMember = InferInsertModel<typeof members>;

export const createMemberInputSchema = z.object({
	email: z.string().trim().email(),
	name: z.string().trim().min(1).max(120).optional().nullable(),
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

export interface DatabaseAdapter {
	readonly adapterType: "d1-binding" | "local-sqlite" | "shared-api";
	listMembers(): Promise<Member[]>;
	createMember(input: CreateMemberInput): Promise<Member>;
	getMemberById(id: string): Promise<Member | null>;
}
