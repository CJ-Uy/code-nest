import { dirname } from "node:path";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { createId } from "@/lib/ids";
import { getAppConfig } from "@/server/env";
import { users } from "../schema";
import type { CreateUserInput, DatabaseAdapter, User } from "../types";

type LocalDatabase = BetterSQLite3Database<{ users: typeof users }>;

export class LocalSqliteDatabaseAdapter implements DatabaseAdapter {
	readonly adapterType = "local-sqlite" as const;
	private dbInstance: LocalDatabase | null = null;

	private async db(): Promise<LocalDatabase> {
		if (this.dbInstance) return this.dbInstance;

		const [{ default: Database }, { drizzle }, fs] = await Promise.all([
			import("better-sqlite3"),
			import("drizzle-orm/better-sqlite3"),
			import("node:fs/promises"),
		]);
		const config = getAppConfig();
		await fs.mkdir(dirname(config.LOCAL_SQLITE_PATH), { recursive: true });
		const sqlite = new Database(config.LOCAL_SQLITE_PATH);
		sqlite.exec(`
			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY,
				email TEXT NOT NULL UNIQUE,
				name TEXT,
				created_at INTEGER NOT NULL DEFAULT (unixepoch())
			);
		`);
		this.dbInstance = drizzle(sqlite, { schema: { users } });
		return this.dbInstance;
	}

	async listUsers(): Promise<User[]> {
		return (await this.db()).select().from(users).orderBy(users.createdAt).all();
	}

	async createUser(input: CreateUserInput): Promise<User> {
		const id = createId("usr");
		const created = (await this.db()).insert(users).values({ id, email: input.email, name: input.name ?? null }).returning().get();
		return created;
	}

	async getUserById(id: string): Promise<User | null> {
		const user = (await this.db()).select().from(users).where(eq(users.id, id)).limit(1).get();
		return user ?? null;
	}
}
