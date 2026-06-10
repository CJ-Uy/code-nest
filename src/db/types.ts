import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import type { users } from "./schema";

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export const createUserInputSchema = z.object({
	email: z.string().trim().email(),
	name: z.string().trim().min(1).max(120).optional().nullable(),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export interface DatabaseAdapter {
	readonly adapterType: "d1-binding" | "local-sqlite" | "shared-api";
	listUsers(): Promise<User[]>;
	createUser(input: CreateUserInput): Promise<User>;
	getUserById(id: string): Promise<User | null>;
}
