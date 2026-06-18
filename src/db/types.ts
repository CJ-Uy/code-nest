import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import type { members } from "./schema";

export type Member = InferSelectModel<typeof members>;
export type NewMember = InferInsertModel<typeof members>;

export const createMemberInputSchema = z.object({
	email: z.string().trim().toLowerCase().email(),
	name: z.string().trim().min(1).max(120).optional().nullable(),
});

export type CreateMemberInput = z.infer<typeof createMemberInputSchema>;

export const updateMemberProfileInputSchema = z.object({
	fullName: z.string().trim().min(1).max(120).nullable().optional(),
	nickname: z.string().trim().min(1).max(80).nullable().optional(),
	pronouns: z.string().trim().max(80).nullable().optional(),
	batch: z.string().trim().max(20).nullable().optional(),
	birthday: z.iso.date().nullable().optional(),
	birthdayPrivate: z.boolean().optional(),
});

export type UpdateMemberProfileInput = z.infer<typeof updateMemberProfileInputSchema>;

export interface DatabaseAdapter {
	readonly adapterType: "d1-binding" | "local-sqlite" | "shared-api";
	listMembers(): Promise<Member[]>;
	createMember(input: CreateMemberInput): Promise<Member>;
	getMemberById(id: string): Promise<Member | null>;
	updateMemberProfile(id: string, input: UpdateMemberProfileInput): Promise<Member>;
}
