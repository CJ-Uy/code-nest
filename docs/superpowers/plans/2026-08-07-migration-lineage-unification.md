# Migration Lineage Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the two incompatible D1 migration histories into one trunk that every environment shares, so promotion is `wrangler d1 migrations apply` with no hand-written reconciliation.

**Architecture:** Production's history becomes the trunk because production holds live data and cannot be rewritten. Beta's nineteen migrations are replaced by a single migration generated from `src/db/schema.ts`, which guarantees the trunk cannot drift from the source of truth the way the hand-written bridge did. Staging is reset to production's exact state and then receives that generated migration as a true rehearsal; beta is wiped and replayed onto the same trunk.

**Tech Stack:** Cloudflare D1, Wrangler 4, Drizzle ORM 0.45, drizzle-kit 0.31, better-sqlite3 (local verification only), Vitest with `@cloudflare/vitest-pool-workers`, TypeScript, tsx.

## Global Constraints

- Work in `C:\Users\charl\Documents\GitHub\code nest` on the `beta` branch.
- Show the exact `pnpm exec wrangler` command and wait for approval before every remote D1 export, reset, migration, seed or delete. This applies to staging as well as production.
- Do not touch `code-nest-prod-db` in this plan. No production migration, no production mutation.
- Never drop or rewrite an existing production short link or analytics row.
- Do not copy production member or content data into staging or beta.
- Take a `wrangler d1 export` backup immediately before any destructive remote operation, and record the output path.
- Avoid em dashes in code, comments, UI copy, docs, commits and README text.
- Only the literal string `"true"` enables a feature flag; this plan does not change any flag value.
- Run `graphify update .` after source changes.
- The full suite must pass before any remote database is touched.

---

### Task 1: Retire the dead tour and align schema.ts with the trunk

`GuidedTour` is never rendered and `markTourSeenAction` is never called. No reader exists for any column of `member_feed_state`. Removing the table now means the `tour_seen_at` versus `announcements_seen_at` divergence disappears instead of needing a reconciling column. `nav_pins.created_by` is widened to nullable to match what staging and production already hold.

**Files:**
- Delete: `src/components/portal/guided-tour.tsx`
- Delete: `src/db/repositories/memberFeed.ts`
- Modify: `src/app/portal/actions.ts`
- Modify: `src/db/repositories/index.ts:10`, `:62`, `:135`
- Modify: `src/db/schema.ts:513-520` (remove `memberFeedState`), `:570-573` (`nav_pins`)

**Interfaces:**
- Produces: `src/db/schema.ts` with no `memberFeedState` export and `navPins.createdBy` nullable. Every later task generates migrations from this file.
- Removes: `Repositories["memberFeed"]`. `Repositories` is `ReturnType<typeof createDrizzleRepositories>`, so deleting the key from both factories updates the type automatically.

- [ ] **Step 1: Confirm the tour is genuinely unreferenced**

```bash
grep -rn "GuidedTour\|guided-tour\|markTourSeenAction\|memberFeed\|tourSeenAt\|surveysSeenAt\|eventsSeenAt" src --include=*.ts --include=*.tsx
```

Expected: matches only in the five files listed above. If any other file appears, stop and report; the deletion is no longer safe.

- [ ] **Step 2: Delete the two dead files**

```bash
git rm src/components/portal/guided-tour.tsx src/db/repositories/memberFeed.ts
```

- [ ] **Step 3: Remove the uncalled action**

In `src/app/portal/actions.ts`, delete the `markTourSeenAction` function entirely. The file becomes:

```ts
"use server";

import { signOut } from "@/auth";

export async function signOutAction(): Promise<void> {
	await signOut({ redirectTo: "/" });
}
```

Note that `getRepositories` and `requireActor` become unused imports and must go with it.

- [ ] **Step 4: Unwire the repository**

In `src/db/repositories/index.ts` delete all three lines:

```ts
import { createMemberFeedRepository, createUnavailableMemberFeedRepository } from "./memberFeed";
```
```ts
		memberFeed: createMemberFeedRepository(d1),
```
```ts
		memberFeed: createUnavailableMemberFeedRepository(),
```

- [ ] **Step 5: Remove the table and widen nav_pins in schema.ts**

Delete the whole `memberFeedState` export at `src/db/schema.ts:513-520`.

In `navPins`, drop the `.notNull()` from `createdBy` so it reads:

```ts
		createdBy: text("created_by").references(() => members.id, { onDelete: "cascade" }),
```

Leave `position` as `integer("position").notNull()`. Staging carries a default of `0` that `schema.ts` does not declare; a default only affects inserts that omit the column, and the repository always supplies it, so the generated migration may or may not reconcile it and either outcome is correct.

- [ ] **Step 6: Typecheck and test**

Run: `pnpm typecheck && pnpm test`
Expected: clean typecheck, 459 tests pass. A failure here means something still referenced the tour; go back to Step 1.

- [ ] **Step 7: Lint and commit**

```bash
npx eslint src/app/portal/actions.ts src/db/repositories/index.ts src/db/schema.ts
graphify update .
git add -A src docs graphify-out
git commit -m "refactor(db): retire the unused tour and member_feed_state

GuidedTour was never rendered and markTourSeenAction was never called.
No column of member_feed_state had a reader, so the table goes with them.
This also removes the tour_seen_at divergence between the two migration
lineages, which no longer needs reconciling.

nav_pins.created_by becomes nullable to match what staging and production
already hold. Widening to nullable cannot invalidate an existing row."
```

---

### Task 2: Build the lineage convergence harness

The hand-written bridge drifted because nothing compared it to `schema.ts`. This harness is the check that makes the failure loud, and Task 3 depends on it to prove the generated trunk is correct.

**Files:**
- Create: `scripts/schema-diff.ts` (pure, no node imports, this is what the test loads)
- Create: `scripts/schema-diff.test.ts`
- Create: `scripts/build-schema.ts` (filesystem and better-sqlite3, never imported by a test)

**Interfaces:**
- Produces from `scripts/schema-diff.ts`: `normalizeSql(sql: string): string` and `diffSchemas(a: SchemaObject[], b: SchemaObject[]): SchemaDiff`, where `SchemaObject = { type: string; name: string; sql: string }` and `SchemaDiff = { onlyInA: string[]; onlyInB: string[]; differing: Array<{ key: string; a: string; b: string }> }`.
- Produces from `scripts/build-schema.ts`: `buildSchemaFromMigrations(dir: string, scratch: string): SchemaObject[]`.
- Consumed by: Task 3 Step 5.

The split is not cosmetic. Every test here runs in the Workers pool, which cannot resolve `node:fs` or load `better-sqlite3`. A test importing a module that pulls either at top level fails before a single assertion runs, the same way an icon import would. Keeping `schema-diff.ts` free of node imports is what makes it testable at all.

- [ ] **Step 1: Write the failing test**

Create `scripts/schema-diff.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { diffSchemas, normalizeSql } from "./schema-diff";

describe("normalizeSql", () => {
	it("ignores formatting that sqlite does not care about", () => {
		expect(normalizeSql("CREATE TABLE `a` (x  INTEGER,\n y TEXT)")).toBe(
			normalizeSql("create table a (x integer, y text)"),
		);
	});

	it("keeps a real difference visible", () => {
		expect(normalizeSql("CREATE TABLE a (x INTEGER NOT NULL)")).not.toBe(
			normalizeSql("CREATE TABLE a (x INTEGER)"),
		);
	});
});

describe("diffSchemas", () => {
	const base = [{ type: "table", name: "a", sql: "CREATE TABLE a (x INTEGER)" }];

	it("reports nothing for identical schemas", () => {
		const diff = diffSchemas(base, [...base]);
		expect(diff.onlyInA).toEqual([]);
		expect(diff.onlyInB).toEqual([]);
		expect(diff.differing).toEqual([]);
	});

	it("reports objects missing from each side", () => {
		const diff = diffSchemas(base, [{ type: "table", name: "b", sql: "CREATE TABLE b (y TEXT)" }]);
		expect(diff.onlyInA).toEqual(["table:a"]);
		expect(diff.onlyInB).toEqual(["table:b"]);
	});

	it("reports a changed definition for a shared name", () => {
		const diff = diffSchemas(base, [{ type: "table", name: "a", sql: "CREATE TABLE a (x TEXT)" }]);
		expect(diff.differing.map((row) => row.key)).toEqual(["table:a"]);
	});

	it("treats pure formatting changes as equal", () => {
		const diff = diffSchemas(base, [{ type: "table", name: "a", sql: "create table `a` (x  integer)" }]);
		expect(diff.differing).toEqual([]);
	});
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run scripts/schema-diff.test.ts`
Expected: FAIL, cannot resolve `./schema-diff`.

- [ ] **Step 3: Implement the pure half**

Create `scripts/schema-diff.ts`. It must import nothing, so the Workers pool can load it.

```ts
export type SchemaObject = { type: string; name: string; sql: string };
export type SchemaDiff = {
	onlyInA: string[];
	onlyInB: string[];
	differing: Array<{ key: string; a: string; b: string }>;
};

/** Collapses formatting sqlite does not distinguish, so only real differences survive. */
export function normalizeSql(sql: string): string {
	return (sql ?? "")
		.replace(/`/g, "")
		.replace(/\s+/g, " ")
		.replace(/,\s*/g, ",")
		.replace(/\(\s*/g, "(")
		.replace(/\s*\)/g, ")")
		.trim()
		.toLowerCase();
}

export function diffSchemas(a: SchemaObject[], b: SchemaObject[]): SchemaDiff {
	const key = (row: SchemaObject) => `${row.type}:${row.name}`;
	const mapA = new Map(a.map((row) => [key(row), normalizeSql(row.sql)]));
	const mapB = new Map(b.map((row) => [key(row), normalizeSql(row.sql)]));
	return {
		onlyInA: [...mapA.keys()].filter((k) => !mapB.has(k)).sort(),
		onlyInB: [...mapB.keys()].filter((k) => !mapA.has(k)).sort(),
		differing: [...mapA.keys()]
			.filter((k) => mapB.has(k) && mapA.get(k) !== mapB.get(k))
			.sort()
			.map((k) => ({ key: k, a: mapA.get(k)!, b: mapB.get(k)! })),
	};
}

```

- [ ] **Step 4: Implement the filesystem half**

Create `scripts/build-schema.ts`. This one is run only through `tsx` and must never be imported by a test.

```ts
import Database from "better-sqlite3";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import type { SchemaObject } from "./schema-diff";

/** Applies every .sql file in a migrations directory to a throwaway database. */
export function buildSchemaFromMigrations(dir: string, scratch: string): SchemaObject[] {
	rmSync(scratch, { force: true });
	const db = new Database(scratch);
	const failures: string[] = [];
	for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
		const sql = readFileSync(path.join(dir, file), "utf8");
		// drizzle separates statements with this marker; D1 applies them one at a time.
		for (const statement of sql.split("--> statement-breakpoint")) {
			const trimmed = statement.trim();
			if (!trimmed) continue;
			try {
				db.exec(trimmed);
			} catch (error) {
				failures.push(`${file}: ${(error as Error).message}`);
			}
		}
	}
	if (failures.length > 0) {
		throw new Error(`Migrations did not apply cleanly:\n${failures.join("\n")}`);
	}
	const rows = db
		.prepare("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name")
		.all() as SchemaObject[];
	db.close();
	rmSync(scratch, { force: true });
	return rows;
}
```

- [ ] **Step 5: Run the test and watch it pass**

Run: `pnpm exec vitest run scripts/schema-diff.test.ts`
Expected: PASS, 6 tests. If it instead fails resolving `node:fs` or `better-sqlite3`, a node import has leaked into `schema-diff.ts`; move it to `build-schema.ts`.

- [ ] **Step 6: Confirm the whole suite still passes**

Run: `pnpm test`
Expected: 465 tests pass, the 459 already present plus the 6 added here. `vitest.config.mts:43` already includes `scripts/**/*.test.ts`, and Task 1 deleted no tests.

- [ ] **Step 7: Commit**

```bash
git add scripts/schema-diff.ts scripts/schema-diff.test.ts scripts/build-schema.ts
git commit -m "test(db): add a schema convergence harness

Nothing compared the two migration lineages to each other or to
schema.ts, which is how the hand-written bridge drifted unnoticed.
This builds a schema from a migrations directory and diffs it, ignoring
formatting sqlite does not distinguish."
```

---

### Task 3: Assemble the unified trunk

Replace beta's nineteen migrations with production's four plus one generated migration, and prove the result matches `schema.ts` before any database is touched.

**Files:**
- Delete: `drizzle/migrations/0001_v5_drop_deferred.sql` through `0019_event_multiday_readonly_and_share_codes.sql`, and the whole of `drizzle/migrations/meta/`
- Create: `drizzle/migrations/0001_member_portal_links.sql`, `0002_link_workspace_fields.sql`, `0003_admin_members_nav.sql` (copied from `drizzle/release-migrations`)
- Create: `drizzle/migrations/0004_unify_schema.sql` (generated)
- Keep: `drizzle/migrations/0000_young_bullseye.sql` (byte-identical in both lineages)

**Interfaces:**
- Consumes: `buildSchemaFromMigrations` and `diffSchemas` from Task 2, and the `schema.ts` produced by Task 1.
- Produces: `drizzle/migrations` as the single trunk, ending at `0004_unify_schema.sql`.

- [ ] **Step 1: Verify the shared origin really is identical**

```bash
diff drizzle/migrations/0000_young_bullseye.sql drizzle/release-migrations/0000_young_bullseye.sql && echo IDENTICAL
```

Expected: `IDENTICAL`. If it differs, stop; the two lineages do not share an origin and this plan's premise is wrong.

- [ ] **Step 2: Replace beta's history with production's**

```bash
git rm -r drizzle/migrations/meta
git rm drizzle/migrations/000[1-9]_*.sql drizzle/migrations/001[0-9]_*.sql
cp drizzle/release-migrations/0001_member_portal_links.sql drizzle/migrations/
cp drizzle/release-migrations/0002_link_workspace_fields.sql drizzle/migrations/
cp drizzle/release-migrations/0003_admin_members_nav.sql drizzle/migrations/
ls drizzle/migrations/
```

Expected listing: exactly `0000_young_bullseye.sql`, `0001_member_portal_links.sql`, `0002_link_workspace_fields.sql`, `0003_admin_members_nav.sql`.

`0004_beta_release_bridge.sql` is deliberately not copied. It is the hand-written artefact being replaced.

- [ ] **Step 3: Generate the reconciling migration**

```bash
pnpm db:generate
```

drizzle-kit reads `src/db/schema.ts`, compares against the snapshot it rebuilds from `drizzle/migrations`, and writes the next numbered file plus a fresh `meta/`. Rename the generated file so its purpose is legible:

```bash
mv drizzle/migrations/0004_*.sql drizzle/migrations/0004_unify_schema.sql
```

If drizzle-kit prompts about renamed or dropped tables, answer that `member_feed_state` is **dropped**, not renamed.

- [ ] **Step 4: Read the generated migration before trusting it**

```bash
grep -icE "drop table" drizzle/migrations/0004_unify_schema.sql
grep -iE "drop table" drizzle/migrations/0004_unify_schema.sql
```

Expected: the only `DROP TABLE` is `member_feed_state`. If any of `announcements`, `articles`, `article_*`, `comments`, `consultancy_teams`, `favorites`, `lists`, `list_items`, `point_awards`, `team_members` or `topics` appears, **stop**. Those hold production data and the trunk must not drop them. Report and await direction.

- [ ] **Step 5: Prove convergence with the harness**

Create `scripts/verify-lineage.ts`:

```ts
import path from "node:path";
import { buildSchemaFromMigrations } from "./build-schema";
import { diffSchemas } from "./schema-diff";

const repo = process.cwd();
const built = buildSchemaFromMigrations(
	path.join(repo, "drizzle/migrations"),
	path.join(repo, ".local/_verify.db"),
);
console.log(`objects built from drizzle/migrations: ${built.length}`);

const previous = process.argv[2];
if (previous) {
	const other = buildSchemaFromMigrations(previous, path.join(repo, ".local/_verify_other.db"));
	const diff = diffSchemas(built, other);
	console.log(`only in trunk:   ${diff.onlyInA.length}`);
	console.log(`only in ${previous}: ${diff.onlyInB.length}`);
	console.log(`differing:       ${diff.differing.length}`);
	for (const row of diff.differing) console.log(`  ${row.key}\n    trunk: ${row.a}\n    other: ${row.b}`);
}
```

Run it:

```bash
pnpm exec tsx scripts/verify-lineage.ts
```

Expected: it prints an object count and does not throw. A throw means the trunk does not apply cleanly, which is a hard stop.

- [ ] **Step 6: Confirm drizzle-kit sees nothing left to do**

```bash
pnpm db:generate
```

Expected: drizzle-kit reports no schema changes and writes no new file. This is the convergence proof from the spec: the trunk and `schema.ts` now agree. If it emits another migration, the trunk is wrong; inspect the emitted diff, delete it, and fix `0004_unify_schema.sql`.

- [ ] **Step 7: Run the suite against the new trunk**

Run: `pnpm test`
Expected: 465 tests pass. `vitest.config.mts` builds its database from `drizzle/migrations` through `readD1Migrations`, so this exercises the trunk end to end and is the strongest available equivalence check.

- [ ] **Step 8: Commit**

```bash
git add -A drizzle/migrations scripts/verify-lineage.ts
git commit -m "refactor(db): rebuild drizzle/migrations on production's history

Beta's 0001 to 0019 are replaced by production's 0001 to 0003 plus one
generated migration. Production holds live data and its history cannot be
rewritten, so beta's is the one that gives way. The reconciling migration
is generated from schema.ts rather than hand-written, which is what the
0004_beta_release_bridge.sql it replaces could not guarantee.

drizzle-kit generate now reports no pending changes, and the suite builds
its test database from this directory and passes."
```

---

### Task 4: Reset staging to production's state and rehearse

Staging has the hand-written bridge applied, so it is neither at production's state nor at the trunk's. It is reset rather than patched, because mirroring production is the only thing that makes the rehearsal meaningful.

**Files:**
- Create: `.local/staged-backup-2026-08-07.sql` (untracked)
- Create: `.local/reset-staged.sql` (untracked)

**Interfaces:**
- Consumes: `drizzle/migrations` from Task 3.
- Produces: `code-nest-staged-db` at `0000` through `0004_unify_schema.sql`.

- [ ] **Step 1: Back up staging and get approval**

Show this command and wait for approval before running:

```bash
pnpm exec wrangler d1 export DB --config wrangler.staging.jsonc --remote --output .local/staged-backup-2026-08-07.sql
```

Record the file size after it completes. Do not continue without a backup on disk.

- [ ] **Step 2: Generate the reset script**

```bash
pnpm exec wrangler d1 execute DB --config wrangler.staging.jsonc --remote --json --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'" > .local/staged-tables.json
```

Then build the drop script:

```bash
node -e "const r=require('./.local/staged-tables.json');const names=r[0].results.map(x=>x.name);require('fs').writeFileSync('.local/reset-staged.sql','PRAGMA defer_foreign_keys = true;\n'+names.map(n=>'DROP TABLE IF EXISTS \"'+n+'\";').join('\n')+'\n');console.log('tables to drop:',names.length)"
cat .local/reset-staged.sql
```

Read the printed script. It must include `d1_migrations`, or the replay in Step 4 will skip everything.

- [ ] **Step 3: Apply the reset and get approval**

Show this command and wait for approval before running. It destroys every table in `code-nest-staged-db`:

```bash
pnpm exec wrangler d1 execute DB --config wrangler.staging.jsonc --remote --file .local/reset-staged.sql
```

- [ ] **Step 4: Replay the trunk to production's state**

Production is at `0003`. To put staging in the same place, temporarily move `0004` aside so the apply stops there:

```bash
mv drizzle/migrations/0004_unify_schema.sql .local/0004_unify_schema.sql.hold
```

Show this command and wait for approval:

```bash
pnpm exec wrangler d1 migrations apply DB --config wrangler.staging.jsonc --remote
```

Expected: four migrations applied, `0000` through `0003`. Staging now matches production exactly.

- [ ] **Step 5: Restore 0004 and rehearse the real thing**

```bash
mv .local/0004_unify_schema.sql.hold drizzle/migrations/0004_unify_schema.sql
pnpm exec wrangler d1 migrations list DB --config wrangler.staging.jsonc --remote
```

Expected: exactly one pending migration, `0004_unify_schema.sql`. This is the same one-step state production will be in.

Show this command and wait for approval:

```bash
pnpm exec wrangler d1 migrations apply DB --config wrangler.staging.jsonc --remote
```

- [ ] **Step 6: Verify staging landed where intended**

```bash
pnpm exec wrangler d1 migrations list DB --config wrangler.staging.jsonc --remote
pnpm exec wrangler d1 execute DB --config wrangler.staging.jsonc --remote --command "SELECT group_concat(name,', ') FROM pragma_table_info('crs_events')"
pnpm exec wrangler d1 execute DB --config wrangler.staging.jsonc --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='member_feed_state'"
```

Expected: nothing pending; `crs_events` includes `all_day`, `read_only` and `public_code`; `member_feed_state` returns no rows.

- [ ] **Step 7: Deploy and check the running site**

```bash
pnpm deploy:staged
```

Then sign in at `https://staged.ateneocode.org/portal` and load the dashboard, calendar, one event detail page, links and profile. Confirm no schema errors. Record which pages were checked.

- [ ] **Step 8: Commit the record**

```bash
git commit --allow-empty -m "chore(db): rehearse the unified trunk on staging

Staging was reset to production's exact state, 0000 through 0003, then
0004_unify_schema.sql was applied as a single step. That is the same
operation production will receive. Backup at .local/staged-backup-2026-08-07.sql."
```

---

### Task 5: Wipe and replay beta

Beta's database still carries the old history in its `d1_migrations` ledger, so it must be rebuilt to join the trunk.

**Files:**
- Create: `.local/beta-backup-2026-08-07.sql` (untracked)
- Create: `.local/reset-beta.sql` (untracked)

**Interfaces:**
- Consumes: `drizzle/migrations` from Task 3.
- Produces: `code-nest-beta-db` at `0000` through `0004_unify_schema.sql`, reseeded.

- [ ] **Step 1: Back up beta and get approval**

Show and wait for approval:

```bash
pnpm exec wrangler d1 export DB --config wrangler.beta.jsonc --remote --output .local/beta-backup-2026-08-07.sql
```

- [ ] **Step 2: Generate the beta reset script**

```bash
pnpm exec wrangler d1 execute DB --config wrangler.beta.jsonc --remote --json --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'" > .local/beta-tables.json
node -e "const r=require('./.local/beta-tables.json');const names=r[0].results.map(x=>x.name);require('fs').writeFileSync('.local/reset-beta.sql','PRAGMA defer_foreign_keys = true;\n'+names.map(n=>'DROP TABLE IF EXISTS \"'+n+'\";').join('\n')+'\n');console.log('tables to drop:',names.length)"
cat .local/reset-beta.sql
```

Confirm `d1_migrations` appears in the printed script.

- [ ] **Step 3: Apply the reset and get approval**

Show and wait for approval. This destroys every table in `code-nest-beta-db`:

```bash
pnpm exec wrangler d1 execute DB --config wrangler.beta.jsonc --remote --file .local/reset-beta.sql
```

- [ ] **Step 4: Replay the full trunk**

Show and wait for approval:

```bash
pnpm exec wrangler d1 migrations apply DB --config wrangler.beta.jsonc --remote
```

Expected: five migrations applied, `0000` through `0004_unify_schema.sql`.

- [ ] **Step 5: Reseed**

Show and wait for approval:

```bash
pnpm db:seed:dev
```

- [ ] **Step 6: Verify and deploy**

```bash
pnpm exec wrangler d1 migrations list DB --config wrangler.beta.jsonc --remote
pnpm deploy:dev
```

Expected: nothing pending. Then sign in at `https://beta.ateneocode.org/portal` and load the dashboard, calendar, one event detail page, links, profile, library and announcements. Beta has every feature flag on, so this exercises far more of the schema than staging does. Record which pages were checked.

- [ ] **Step 7: Reset the local development database**

```bash
rm -f .local/dev.db
pnpm db:migrate:local:sqlite
pnpm db:seed:local
```

Expected: the local database rebuilds from the trunk without error.

- [ ] **Step 8: Commit the record**

```bash
git commit --allow-empty -m "chore(db): rebuild beta on the unified trunk

code-nest-beta-db was wiped and replayed from 0000 through 0004, then
reseeded. All three environments now share one migration history.
Backup at .local/beta-backup-2026-08-07.sql."
```

---

### Task 6: Retire the second directory and document the trunk

With every environment on one history, the second directory and the split it encoded are removed.

**Files:**
- Delete: `drizzle/release-migrations/` (all six files including `README.md`)
- Modify: `wrangler.staging.jsonc` (`migrations_dir`), `wrangler.jsonc` (`migrations_dir` and the comment above `database_name`)
- Create: `drizzle/migrations/README.md`
- Modify: `docs/superpowers/plans/2026-08-05-beta-to-staging-release.md`

**Interfaces:**
- Consumes: the completed state from Tasks 4 and 5.
- Produces: a single `migrations_dir` value across all three wrangler configs.

- [ ] **Step 1: Point staging and production at the trunk**

In `wrangler.staging.jsonc` and `wrangler.jsonc`, set `"migrations_dir": "drizzle/migrations"` and delete the comments that explain the two-lineage split, which no longer exists. Leave `wrangler.beta.jsonc` as it is; it already points there.

- [ ] **Step 2: Confirm all three agree**

```bash
grep -n "migrations_dir" wrangler.jsonc wrangler.staging.jsonc wrangler.beta.jsonc
```

Expected: three lines, all `drizzle/migrations`.

- [ ] **Step 3: Delete the second directory**

```bash
git rm -r drizzle/release-migrations
```

- [ ] **Step 4: Document the trunk**

Create `drizzle/migrations/README.md`:

```markdown
# Migrations

One history, shared by every environment. `0000` through `0003` are the history
production has always had. `0004_unify_schema.sql` was generated from
`src/db/schema.ts` and brings a database up to what the application expects.

Each environment sits at a prefix of this list:

| Environment | Database | Config |
| --- | --- | --- |
| beta | `code-nest-beta-db` | `wrangler.beta.jsonc` |
| staging | `code-nest-staged-db` | `wrangler.staging.jsonc` |
| production | `code-nest-prod-db` | `wrangler.jsonc` |

## Adding a change

Edit `src/db/schema.ts`, then run `pnpm db:generate`. Never hand-write a
migration to reconcile an environment. A hand-written migration is a second copy
of the schema, and the one this project used to keep drifted: it left staging
without `member_feed_state.tour_seen_at` while `schema.ts` still declared it, and
nothing caught it. `pnpm db:generate` reporting no changes is the check that the
directory and `schema.ts` agree.

Apply outward, never inward: beta, then staging, then production.

    pnpm db:migrate:dev
    pnpm db:migrate:staged
    pnpm db:migrate:prod

`pnpm db:migrate:prod` passes no `--config` and reads `wrangler.jsonc` from
whatever tree is checked out, so keep these configs correct on every branch.

Check what is pending without writing anything:

    pnpm exec wrangler d1 migrations list DB --config wrangler.staging.jsonc --remote

## Tables that are present but unused

`0000` created `articles`, `article_*`, `comments`, `announcements`,
`consultancy_teams`, `favorites`, `lists`, `list_items`, `point_awards`,
`team_members` and `topics`. Nothing reads them. They are left in place because
dropping a table in production needs its own decision and a check that it is
empty. Do not add a migration that drops them without that check.
```

- [ ] **Step 5: Mark the superseded plan**

At the top of `docs/superpowers/plans/2026-08-05-beta-to-staging-release.md`, directly under the title, add:

```markdown
> **Superseded in part, 2026-08-07.** The separate migration directory this plan
> introduced has been replaced by a single history. See
> `docs/superpowers/specs/2026-08-07-migration-lineage-unification-design.md`.
> The feature-flag work in tasks 1 to 5 still stands; tasks 1 and part of 2 were
> implemented in commits f8bd0f3 and dbbebe4.
```

- [ ] **Step 6: Full verification**

```bash
pnpm typecheck && pnpm test
pnpm exec wrangler d1 migrations list DB --config wrangler.beta.jsonc --remote
pnpm exec wrangler d1 migrations list DB --config wrangler.staging.jsonc --remote
```

Expected: clean typecheck, 465 tests pass, and both environments report nothing pending.

- [ ] **Step 7: Commit and push**

```bash
graphify update .
git add -A drizzle wrangler.jsonc wrangler.staging.jsonc docs graphify-out
git commit -m "refactor(db): retire the second migration directory

Every environment is now on one history, so drizzle/release-migrations
and the split it encoded are removed. All three wrangler configs point at
drizzle/migrations.

The new README records why a migration is never hand-written here: the
bridge that was, drifted, and left staging without a column schema.ts
declared."
git push origin beta
```

---

## Remaining after this plan

Production is still at `0003` and has not been touched. Applying `0004_unify_schema.sql` to `code-nest-prod-db` is deliberately a separate piece of work, because it is the first genuinely irreversible step. Before it runs:

- confirm the row counts in the eleven unused tables so it is clear what is being left behind
- take a `wrangler d1 export` backup of production
- apply the identical file that Task 4 rehearsed on staging

Feature-flag enforcement for server actions and internal route handlers, tasks 2 to 5 of the 2026-08-05 release plan, is also still outstanding and unrelated to this work.
