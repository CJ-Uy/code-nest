import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const localSqlitePath = process.env.LOCAL_SQLITE_PATH ?? "./.local/dev.db";

mkdirSync(dirname(localSqlitePath), { recursive: true });

const sqlite = new Database(localSqlitePath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "drizzle/migrations" });
sqlite.close();

console.log(`Applied migrations to ${localSqlitePath}`);
