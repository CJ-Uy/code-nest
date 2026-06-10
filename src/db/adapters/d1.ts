import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { createId } from "@/lib/ids";
import { getCloudflareEnv } from "@/server/cloudflare";
import { users } from "../schema";
import type { CreateUserInput, DatabaseAdapter, User } from "../types";

export class D1DatabaseAdapter implements DatabaseAdapter {
	readonly adapterType = "d1-binding" as const;

	private db() {
		const env = getCloudflareEnv();
		if (!env.DB) {
			throw new Error("Cloudflare D1 binding DB is unavailable.");
		}
		return drizzle(env.DB, { schema: { users } });
	}

	async listUsers(): Promise<User[]> {
		return this.db().select().from(users).orderBy(users.createdAt);
	}

	async createUser(input: CreateUserInput): Promise<User> {
		const id = createId("usr");
		const [created] = await this.db().insert(users).values({ id, email: input.email, name: input.name ?? null }).returning();
		return created;
	}

	async getUserById(id: string): Promise<User | null> {
		const [user] = await this.db().select().from(users).where(eq(users.id, id)).limit(1);
		return user ?? null;
	}
}
