# Events & Points Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin Events & Points console able to answer who attended what, who was late, and who scanned them — while demoting retention from a special cross-cutting flag to an ordinary permanent point type.

**Architecture:** Two migrations straddle the code deploy: `0014` is additive and safe before it, `0015` drops a column and is safe only after. Attendance status (on-time/late/absent) is derived at read time by one pure function, never stored. A new read-only repository, `attendance-reports.ts`, replaces the current whole-term client-side data dump with bounded, server-filtered queries. The single admin page splits into six sibling routes, each answering one question.

**Tech Stack:** Next.js App Router (server components), Drizzle ORM on Cloudflare D1, Tailwind CSS v4, shadcn-style local primitives in `src/components/ui`, Vitest in the Cloudflare Workers pool, Zod.

**Spec:** `docs/superpowers/specs/2026-07-30-events-points-admin-design.md` (revision 2). Read it before starting. Where this plan and the spec disagree, the spec wins — report the conflict rather than guessing.

## Global Constraints

- `src/db/schema.ts` is the only schema source. Never write SQL DDL without a matching Drizzle field change.
- Do not expose D1 as `DATABASE_URL`. Do not add raw SQL internal endpoints.
- All tests run in the Vitest Workers pool: `.ts` only, no jsdom, no render tests, no `better-sqlite3` import. Config at `vitest.config.mts:33`; setup applies migrations via `applyD1Migrations` in `src/test/setup-d1.ts`.
- Migration files live in `drizzle/migrations/`, numbered sequentially, statements separated by `--> statement-breakpoint`. The local runner reads the migrations **directory**, not Drizzle's journal.
- Never run a D1 reset, migration, seed, delete, or production-touching command without showing the exact `pnpm exec wrangler` command and getting approval first.
- Never append `Co-Authored-By` or AI attribution trailers to commits in this repo.
- Interface copy: plain and specific. No em dashes, no promotional filler.
- User-controlled strings (member names, point type labels) render with `min-w-0` + `break-all`. `break-words` does not work here.
- Brand palette only in admin tables. No emerald/amber/red. `--destructive` is near-black, not red.
- Retention point type id is the literal `pt_retention`; import `RETENTION_POINT_TYPE_ID` rather than retyping it.
- Default grace period is 15 minutes; import `DEFAULT_GRACE_MINUTES`.
- Run `pnpm typecheck` and `pnpm lint` before every commit. A task is not done if either fails.

---

## File Structure

**Created**

| File | Responsibility |
|---|---|
| `drizzle/migrations/0014_attendance_grace_and_audit_target.sql` | Additive DDL + backfill, safe pre-deploy |
| `drizzle/migrations/0015_drop_counts_toward_retention.sql` | Destructive DDL, safe post-deploy only |
| `src/lib/point-types.ts` | `RETENTION_POINT_TYPE_ID`, `DEFAULT_GRACE_MINUTES` |
| `src/lib/attendance-status.ts` | Pure late/on-time derivation. The only place the rule lives |
| `src/lib/attendance-status.test.ts` | Boundary tests for the above |
| `src/db/repositories/attendance-reports.ts` | Five bounded read models for the admin console. No writes |
| `src/db/repositories/attendance-reports.integration.test.ts` | Tests for the above |
| `src/components/portal/attendance-status-cell.tsx` | Renders on-time/late/absent. Owns the visual rule |
| `src/app/portal/admin/data/events/page.tsx` | Events list |
| `src/app/portal/admin/data/events/[id]/page.tsx` | Event roster |
| `src/app/portal/admin/data/members/page.tsx` | Members list |
| `src/app/portal/admin/data/scans/page.tsx` | Scan log |
| `src/app/portal/admin/data/ledger/page.tsx` | Points ledger, paginated |
| `src/app/portal/admin/members/[id]/page.tsx` | Member attendance + points profile |

**Modified**

| File | Change |
|---|---|
| `src/db/schema.ts` | `crsEvents.graceMinutes`; `auditLogs.targetMemberId` + 2 indexes |
| `src/db/repositories/audit.ts` | `AuditRecordInput.targetMemberId`, mapped in `auditInsertValues` |
| `src/db/repositories/events.ts` | Audit inserts into `runAtomic`; `undoScan` owner rule; scan/undo pass `targetMemberId` |
| `src/db/repositories/retention.ts` | 4 predicates to `pt_retention`; delete `PublicLeaderboardSelection` |
| `src/db/repositories/overview.ts` | 1 predicate to `pt_retention` |
| `src/db/repositories/pointTypes.ts` | Drop flag from types/selects/writes; replace guard with retention-retire guard |
| `src/db/repositories/retention-unavailable.ts` | Match new `publicLeaderboard` signature |
| `src/db/seed/data.ts` | Drop flag from 3 seeded types |
| `scripts/verify-points-upsert-local.ts` | Drop flag |
| `src/app/portal/admin/nav.ts` | Register 5 new pages in the `data` group |
| `src/app/portal/admin/data/page.tsx` | Becomes Overview |
| `src/app/portal/page.tsx` | Scanner panel to top; `.find()` → `.filter()` |
| `src/components/event-scan-panel.tsx` | Real `canUndo`; accent treatment |
| `src/app/portal/events/page.tsx` | Retitle to Points; point-type filter on history |
| `src/app/portal/admin/system/point-types/*` | Remove flag UI, add lock affordance |
| `src/app/portal/calendar/create-event-sheet.tsx` | Grace input |
| `src/app/portal/calendar/[eventId]/event-manage-panel.tsx` | Grace input |
| `src/app/portal/profile/point-breakdown.ts` | `retention` derived from id |

**Deleted**

| File | Reason |
|---|---|
| `src/app/portal/admin/data/events-points-dashboard.tsx` | Decomposed across the new routes |
| `src/app/portal/admin/data/retention/page.tsx` | Bare redirect, obsolete |
| `loadAttendance` in `src/app/portal/admin/data/retention/data.ts` | Replaced by `attendance-reports.ts`. Keep `loadRetentionPickers` |
| `src/server/internal/events.ts:145-150` | Unreachable dead deny-branch |

---

# Phase 1 — Foundations

### Task 1: Migration 0014 and schema fields

**Files:**
- Create: `drizzle/migrations/0014_attendance_grace_and_audit_target.sql`
- Modify: `src/db/schema.ts:190-218` (crsEvents), `src/db/schema.ts:523-542` (auditLogs)

**Interfaces:**
- Produces: `crsEvents.graceMinutes: number | null`; `auditLogs.targetMemberId: string | null`

- [ ] **Step 1: Write the migration**

Create `drizzle/migrations/0014_attendance_grace_and_audit_target.sql`:

```sql
ALTER TABLE `crs_events` ADD COLUMN `grace_minutes` integer;
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD COLUMN `target_member_id` text REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null;
--> statement-breakpoint
CREATE INDEX `audit_logs_target_member_created_idx` ON `audit_logs` (`target_member_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `audit_logs_action_created_idx` ON `audit_logs` (`action`, `created_at`);
--> statement-breakpoint
UPDATE `audit_logs`
SET `target_member_id` = substr(`detail`, 8)
WHERE `category` = 'event'
  AND `action` IN ('event:scan_attendance', 'event:undo_scan')
  AND `detail` LIKE 'member=%';
```

`substr` is 1-indexed and `member=` is 7 characters, so position 8 is the first character of the id.

- [ ] **Step 2: Add the Drizzle field for grace_minutes**

In `src/db/schema.ts`, inside `crsEvents`, after the `capacity` line:

```ts
		graceMinutes: integer("grace_minutes"),
```

- [ ] **Step 3: Add the Drizzle field and indexes for target_member_id**

In `src/db/schema.ts`, inside `auditLogs`, after the `detail` line:

```ts
		targetMemberId: text("target_member_id").references(() => members.id, { onDelete: "set null" }),
```

And in the same table's index array, after the existing two:

```ts
		index("audit_logs_target_member_created_idx").on(table.targetMemberId, table.createdAt),
		index("audit_logs_action_created_idx").on(table.action, table.createdAt),
```

- [ ] **Step 4: Verify the migration applies and typechecks**

Run: `pnpm typecheck`
Expected: PASS.

Run: `pnpm vitest run src/db/repositories/audit.integration.test.ts 2>/dev/null || pnpm vitest run src/db/repositories/events.integration.test.ts`
Expected: PASS. The Workers pool applies `drizzle/migrations/` on every run, so a malformed `0014` fails here immediately.

- [ ] **Step 5: Commit**

```bash
git add drizzle/migrations/0014_attendance_grace_and_audit_target.sql src/db/schema.ts
git commit -m "feat(db): add event grace_minutes and audit target_member_id"
```

---

### Task 2: Shared constants

**Files:**
- Create: `src/lib/point-types.ts`

**Interfaces:**
- Produces: `RETENTION_POINT_TYPE_ID: "pt_retention"`, `DEFAULT_GRACE_MINUTES: 15`

- [ ] **Step 1: Write the module**

```ts
/**
 * The Retention point type always exists and cannot be retired. It is an ordinary
 * point type in every other respect; retention progress is simply the sum of records
 * carrying this id.
 */
export const RETENTION_POINT_TYPE_ID = "pt_retention";

/** Grace window applied when an event sets no explicit `graceMinutes`. */
export const DEFAULT_GRACE_MINUTES = 15;
```

- [ ] **Step 2: Verify**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/point-types.ts
git commit -m "feat(lib): add retention point type and grace period constants"
```

---

### Task 3: Attendance status derivation

**Files:**
- Create: `src/lib/attendance-status.ts`, `src/lib/attendance-status.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_GRACE_MINUTES` from Task 2
- Produces: `type AttendanceStatus = "on_time" | "late"`, `attendanceStatus(scannedAt, startsAt, graceMinutes)`, `minutesLate(scannedAt, startsAt, graceMinutes)`

- [ ] **Step 1: Write the failing test**

Create `src/lib/attendance-status.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { attendanceStatus, minutesLate } from "./attendance-status";

const START = new Date("2026-03-01T10:00:00.000Z");
const at = (minutes: number, ms = 0) => new Date(START.getTime() + minutes * 60_000 + ms);

describe("attendanceStatus", () => {
	it("treats a scan before the start as on time", () => {
		expect(attendanceStatus(at(-20), START, 15)).toBe("on_time");
	});

	it("treats a scan exactly at the end of the grace window as on time", () => {
		expect(attendanceStatus(at(15), START, 15)).toBe("on_time");
	});

	it("treats one millisecond past the grace window as late", () => {
		expect(attendanceStatus(at(15, 1), START, 15)).toBe("late");
	});

	it("falls back to the default grace when none is set", () => {
		expect(attendanceStatus(at(15), START, null)).toBe("on_time");
		expect(attendanceStatus(at(16), START, null)).toBe("late");
	});

	it("honours a zero grace window", () => {
		expect(attendanceStatus(at(0), START, 0)).toBe("on_time");
		expect(attendanceStatus(at(1), START, 0)).toBe("late");
	});
});

describe("minutesLate", () => {
	it("returns 0 when on time", () => {
		expect(minutesLate(at(15), START, 15)).toBe(0);
		expect(minutesLate(at(-30), START, 15)).toBe(0);
	});

	it("measures from the end of the grace window, not the start time", () => {
		expect(minutesLate(at(27), START, 15)).toBe(12);
	});

	it("floors partial minutes", () => {
		expect(minutesLate(at(16, 59_000), START, 15)).toBe(1);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/attendance-status.test.ts`
Expected: FAIL — cannot resolve `./attendance-status`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/attendance-status.ts`:

```ts
import { DEFAULT_GRACE_MINUTES } from "./point-types";

export type AttendanceStatus = "on_time" | "late";

const graceMs = (graceMinutes: number | null) => (graceMinutes ?? DEFAULT_GRACE_MINUTES) * 60_000;

/**
 * Derived at read time, never stored. Correcting an event's start time or grace window
 * retroactively fixes every status rather than requiring a backfill.
 */
export function attendanceStatus(
	scannedAt: Date,
	startsAt: Date,
	graceMinutes: number | null,
): AttendanceStatus {
	return scannedAt.getTime() > startsAt.getTime() + graceMs(graceMinutes) ? "late" : "on_time";
}

/**
 * Whole minutes past the end of the grace window; 0 when on time. Measured from the end
 * of the window rather than from `startsAt`, so "+1 min" means one minute past the point
 * where lateness began.
 */
export function minutesLate(scannedAt: Date, startsAt: Date, graceMinutes: number | null): number {
	const over = scannedAt.getTime() - startsAt.getTime() - graceMs(graceMinutes);
	return over > 0 ? Math.floor(over / 60_000) : 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/attendance-status.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/attendance-status.ts src/lib/attendance-status.test.ts
git commit -m "feat(lib): derive attendance lateness from event grace window"
```

---

# Phase 2 — Audit layer

### Task 4: Record the scanned member on audit rows

**Files:**
- Modify: `src/db/repositories/audit.ts:19-26` (`AuditRecordInput`), `:46-57` (`auditInsertValues`)
- Test: `src/db/repositories/audit.integration.test.ts` (create if absent)

**Interfaces:**
- Produces: `AuditRecordInput.targetMemberId?: string | null`

- [ ] **Step 1: Write the failing test**

Create or extend `src/db/repositories/audit.integration.test.ts`:

```ts
import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { auditLogs, members } from "@/db/schema";
import { createAuditRepository } from "./audit";
import type { Actor } from "@/server/auth/permissions";

const admin: Actor = { memberId: "mem_admin", roles: ["super_admin"], context: "session" } as Actor;

describe("audit target member", () => {
	it("writes and queries target_member_id", async () => {
		const db = drizzle(env.DB, { schema });
		await db.insert(members).values([
			{ id: "mem_admin", email: "admin@example.com", status: "active" },
			{ id: "mem_target", email: "target@example.com", status: "active" },
		]).onConflictDoNothing();

		const audit = createAuditRepository(db);
		await audit.record(admin, {
			action: "event:scan_attendance",
			targetType: "event",
			targetId: "evt_1",
			category: "event",
			detail: "member=mem_target",
			targetMemberId: "mem_target",
		});

		const rows = await db.select().from(auditLogs).where(eq(auditLogs.targetMemberId, "mem_target"));
		expect(rows).toHaveLength(1);
		expect(rows[0].action).toBe("event:scan_attendance");
	});
});
```

If the file already exists, add only the `describe` block and reuse its existing fixtures.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/db/repositories/audit.integration.test.ts`
Expected: FAIL — `targetMemberId` is not a known property of `AuditRecordInput`.

- [ ] **Step 3: Add the field and map it**

In `src/db/repositories/audit.ts`, extend `AuditRecordInput`:

```ts
export type AuditRecordInput = {
	action: string;
	targetType: string;
	targetId: string;
	category: AuditCategory;
	detail?: string | null;
	/** The member the action was performed *on*, when there is one. Indexed; `detail` is not. */
	targetMemberId?: string | null;
};
```

And in `auditInsertValues`, after the `detail` line:

```ts
		targetMemberId: input.targetMemberId ?? null,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/db/repositories/audit.integration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/repositories/audit.ts src/db/repositories/audit.integration.test.ts
git commit -m "feat(audit): record the target member id on audit entries"
```

---

### Task 5: Make scan and undo audit entries atomic

**Files:**
- Modify: `src/db/repositories/events.ts:604-631` (`recordScan`), `:642-661` (`undoScan`)
- Test: `src/db/repositories/events.integration.test.ts`

**Interfaces:**
- Consumes: `auditInsertValues` from `./audit`, `AuditRecordInput.targetMemberId` from Task 4

`recordScan` and `undoScan` currently `await audit.record(...)` **after** `runAtomic(...)`. A failure between the two loses the audit row silently, which the scan log in Phase 5 depends on. `auditInsertValues` exists precisely so a repository can batch its own audit insert.

- [ ] **Step 1: Write the failing test**

Add to `src/db/repositories/events.integration.test.ts`, inside the existing scan describe block:

```ts
it("writes the scan audit row with the scanned member id", async () => {
	const { events } = await makeRepos();
	await events.recordScan(scanner, { eventId: EVENT_ID, memberId: "mem_target", termId: TERM_ID });

	const rows = await db
		.select()
		.from(auditLogs)
		.where(and(eq(auditLogs.action, "event:scan_attendance"), eq(auditLogs.targetMemberId, "mem_target")));
	expect(rows).toHaveLength(1);
});
```

Import `auditLogs` from `@/db/schema` and `and`, `eq` from `drizzle-orm` if not already imported. Reuse the file's existing `makeRepos()`, `scanner`, `EVENT_ID`, `TERM_ID` fixtures rather than defining new ones.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/db/repositories/events.integration.test.ts -t "scanned member id"`
Expected: FAIL — 0 rows, because `targetMemberId` is not yet passed.

- [ ] **Step 3: Move both audit writes into their atomic batch**

In `recordScan`, delete the `await audit.record({...})` call that follows `runAtomic` and add the insert into the batch instead. Import `auditInsertValues` at the top of `events.ts`:

```ts
import { auditInsertValues } from "./audit";
```

Then in `recordScan`, the batch becomes:

```ts
await runAtomic(db, [
	// ...the existing attendance and points inserts, unchanged...
	db.insert(auditLogs).values(
		auditInsertValues(actor, {
			action: "event:scan_attendance",
			targetType: "event",
			targetId: input.eventId,
			category: "event",
			detail: `member=${input.memberId}`,
			targetMemberId: input.memberId,
		}),
	),
]);
```

Apply the same change in `undoScan`, using `action: "event:undo_scan"`. Import `auditLogs` from `@/db/schema` if not already imported. `detail` is retained alongside `targetMemberId` for compatibility with existing rows.

- [ ] **Step 4: Run the full events suite**

Run: `pnpm vitest run src/db/repositories/events.integration.test.ts`
Expected: PASS, including the pre-existing scan and undo tests.

- [ ] **Step 5: Commit**

```bash
git add src/db/repositories/events.ts src/db/repositories/events.integration.test.ts
git commit -m "fix(events): write scan audit entries inside the atomic batch"
```

---

# Phase 3 — Retention de-specialization

> This is the largest phase by file count and carries all the test breakage. It ends when a scoped `rg` returns zero. Do not start Phase 4 until it does.

### Task 6: Retention and overview repositories

**Files:**
- Modify: `src/db/repositories/retention.ts:51-56, :167, :202, :217, :373`, `src/db/repositories/overview.ts:59`, `src/db/repositories/retention-unavailable.ts:11`
- Test: `src/db/repositories/retention.integration.test.ts:100, :126, :152`

**Interfaces:**
- Consumes: `RETENTION_POINT_TYPE_ID` from Task 2
- Produces: `publicLeaderboard(actor, { termId, pointTypeId, limit?, offset? })` — the `PublicLeaderboardSelection` union is gone

- [ ] **Step 1: Rewrite the breaking tests first**

In `src/db/repositories/retention.integration.test.ts`:

- Replace every `{ kind: "retention" }` argument with `{ pointTypeId: RETENTION_POINT_TYPE_ID }` and every `{ kind: "pointType", pointTypeId: X }` with `{ pointTypeId: X }`.
- **Delete** any test asserting that two different point types both contribute to a retention total. That behaviour is being removed deliberately; keeping the test would encode the old semantics.
- Add:

```ts
it("counts only the retention point type toward the retention total", async () => {
	const { retention } = await makeRepos();
	await seedPointType({ id: "pt_other", key: "other", label: "Other" });
	await seedRecord({ memberId: MEMBER_ID, pointTypeId: RETENTION_POINT_TYPE_ID, points: 5 });
	await seedRecord({ memberId: MEMBER_ID, pointTypeId: "pt_other", points: 100 });

	const summary = await retention.memberTermSummary(admin, { memberId: MEMBER_ID, termId: TERM_ID });
	expect(summary.totalPoints).toBe(5);
});
```

Reuse the file's existing seed helpers; do not invent new ones.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/db/repositories/retention.integration.test.ts`
Expected: FAIL — totals include the other type's 100 points.

- [ ] **Step 3: Switch the predicates**

Import in `retention.ts` and `overview.ts`:

```ts
import { RETENTION_POINT_TYPE_ID } from "@/lib/point-types";
```

At each of `retention.ts:167`, `:202`, `:217`, `:373` and `overview.ts:59`, replace

```ts
eq(pointTypes.countsTowardRetention, true)
```

with

```ts
eq(retentionRecords.pointTypeId, RETENTION_POINT_TYPE_ID)
```

Where that predicate was the only reason for the `innerJoin(pointTypes, ...)`, remove the join too. At `:373` the row shape carries a `countsTowardRetention` boolean used in a `reduce`; replace it with `row.pointTypeId === RETENTION_POINT_TYPE_ID`.

- [ ] **Step 4: Delete the selection union**

Remove `PublicLeaderboardSelection` and `PublicLeaderboardInput`'s `selection` field (`retention.ts:51-56`). `publicLeaderboard` now takes `{ termId, pointTypeId, limit?, offset? }` and always filters `eq(retentionRecords.pointTypeId, input.pointTypeId)`.

Update `src/db/repositories/retention-unavailable.ts:11` so its stub signature still matches. It throws either way; this is a typecheck fix only.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm vitest run src/db/repositories/retention.integration.test.ts src/db/repositories/overview.integration.test.ts`
Expected: PASS.

Run: `pnpm typecheck`
Expected: PASS. If `src/app/portal/events/page.tsx` errors on the removed union, leave it — Task 10 fixes that file. If you need a green typecheck to commit, do Task 10's edit now and note it.

- [ ] **Step 6: Commit**

```bash
git add src/db/repositories/retention.ts src/db/repositories/overview.ts src/db/repositories/retention-unavailable.ts src/db/repositories/retention.integration.test.ts
git commit -m "refactor(retention): treat retention as an ordinary point type"
```

---

### Task 7: Point types repository — drop the flag, add the retire guard

**Files:**
- Modify: `src/db/repositories/pointTypes.ts:7, :14-30, :45, :69, :88-104`
- Test: `src/db/repositories/pointTypes.integration.test.ts:12`

**Interfaces:**
- Produces: `PointTypeRow` and `PointTypeUpsertInput` without `countsTowardRetention`

Only one new guard is needed. Key changes are already blocked for every type at `pointTypes.ts:86`, and `PointTypesRepository` exposes no delete method, so "cannot rename, cannot delete" are already true.

- [ ] **Step 1: Write the failing test**

In `src/db/repositories/pointTypes.integration.test.ts`, first remove `countsTowardRetention` from every fixture and assertion, then add:

```ts
it("refuses to retire the retention point type", async () => {
	const repo = await makeRepo();
	await expect(
		repo.upsertType(admin, {
			id: RETENTION_POINT_TYPE_ID,
			key: "retention",
			label: "Retention",
			active: false,
			position: 0,
		}),
	).rejects.toThrow("The Retention point type cannot be retired.");
});

it("allows relabelling and reordering the retention point type", async () => {
	const repo = await makeRepo();
	const row = await repo.upsertType(admin, {
		id: RETENTION_POINT_TYPE_ID,
		key: "retention",
		label: "CRS Retention",
		active: true,
		position: 3,
	});
	expect(row.label).toBe("CRS Retention");
	expect(row.position).toBe(3);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/db/repositories/pointTypes.integration.test.ts`
Expected: FAIL — no such error is thrown.

- [ ] **Step 3: Remove the flag and replace the guard**

In `src/db/repositories/pointTypes.ts`:

- Delete the `LAST_RETENTION_TYPE_ERROR` constant (line 7) and add:

```ts
const RETENTION_RETIRE_ERROR = "The Retention point type cannot be retired.";
```

- Remove `countsTowardRetention` from `PointTypeRow` and `PointTypeUpsertInput`, from the `list()` select (`:45`), and from both write paths (`:69`, `:104`).
- Replace the entire `exists(...)` guard block (`:88-101`) with a plain id match, and add the retire check before the update:

```ts
if (input.id === RETENTION_POINT_TYPE_ID && !input.active) {
	throw new Error(RETENTION_RETIRE_ERROR);
}
const updated = await db.update(pointTypes).set({
	label,
	active: input.active,
	position: input.position,
	updatedBy: actor.memberId,
	updatedAt: new Date(),
}).where(eq(pointTypes.id, input.id)).returning();
if (updated.length === 0) throw new Error("Point type not found.");
```

Remove the now-unused `exists` and `ne` imports from the `drizzle-orm` import on line 1.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/db/repositories/pointTypes.integration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/repositories/pointTypes.ts src/db/repositories/pointTypes.integration.test.ts
git commit -m "feat(point-types): make the retention type permanent, drop the flag"
```

---

### Task 8: Sweep every remaining caller

**Files:**
- Modify: `src/db/seed/data.ts:42-44`, `src/db/seed/data.test.ts:23,:25`, `scripts/verify-points-upsert-local.ts:22`, `src/app/portal/admin/system/point-types/actions.ts:19`, `src/app/portal/admin/system/point-types/input.ts`, `input.test.ts:12`, `src/app/portal/profile/point-breakdown.ts:24`, `point-breakdown.test.ts:5,:37,:47,:55`, `src/app/portal/calendar/[eventId]/award-editor-input.test.ts:9`, `src/db/additive-points-schema.integration.test.ts:16`, `src/db/repositories/events.integration.test.ts:63,:70,:122`, `src/db/repositories/overview.integration.test.ts:35`

- [ ] **Step 1: Remove the flag from seed data and the script**

Drop `countsTowardRetention` from all three entries in `src/db/seed/data.ts:42-44`, from the assertions at `src/db/seed/data.test.ts:23,:25`, and from `scripts/verify-points-upsert-local.ts:22`.

- [ ] **Step 2: Fix point-breakdown**

In `src/app/portal/profile/point-breakdown.ts:24`, replace `retention: type.countsTowardRetention` with:

```ts
retention: type.id === RETENTION_POINT_TYPE_ID,
```

Import the constant. Update the four fixture sites in `point-breakdown.test.ts` to set an `id` rather than a flag.

- [ ] **Step 3: Fix the point-types action and input parser**

In `actions.ts:19-21`, the retention-first ordering pass has nothing left to order by. Replace the three lines with a single pass over `inputs` in their given order.

In `input.ts`, delete the `retentionIds` set (`:26`), the `countsTowardRetention` field (`:15`), the `retentionIds.has(id)` mapping (`:46`), and the last-retention-type validator (`:50-52`). Delete the corresponding cases in `input.test.ts:12` onward.

- [ ] **Step 4: Fix remaining test fixtures**

Remove `countsTowardRetention` from the seeded point types in `award-editor-input.test.ts:9`, `additive-points-schema.integration.test.ts:16`, `events.integration.test.ts:63,:70,:122`, and `overview.integration.test.ts:35`.

`additive-points-schema.integration.test.ts:16` names the column in raw SQL. It keeps passing until `0015` runs, but fix it now so Task 24 needs no code change.

- [ ] **Step 5: Run the completion gate**

Run:

```bash
rg -n "countsTowardRetention|counts_toward_retention" src scripts
```

Expected: **zero hits.** The unscoped search will always match this plan and the spec, which is why it is scoped to `src` and `scripts`. `drizzle/migrations/0013_additive_points_schema.sql` legitimately keeps the term as historical SQL.

- [ ] **Step 6: Run the full suite**

Run: `pnpm vitest run && pnpm typecheck && pnpm lint`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add -A src scripts
git commit -m "refactor: remove the counts_toward_retention flag from every caller"
```

---

### Task 9: Point types admin UI

**Files:**
- Modify: `src/app/portal/admin/system/point-types/point-types-manager.tsx:43-46, :134, :173-181`

- [ ] **Step 1: Remove the flag controls**

Delete the "Counts toward retention" checkbox from the create form (`:43-46`), the `Retention` badge (`:134`), and the checkbox from each editable row (`:173-181`).

- [ ] **Step 2: Add the lock affordance**

For the row whose `id === RETENTION_POINT_TYPE_ID`, render the active toggle as disabled with a lock icon beside it:

```tsx
{row.id === RETENTION_POINT_TYPE_ID ? (
	<span
		className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
		title="Retention always exists and cannot be retired."
	>
		<Lock className="size-3.5" aria-hidden />
		Always active
	</span>
) : (
	<input type="checkbox" name="activeIds" value={row.id} defaultChecked={row.active} className="size-4 accent-primary" />
)}
```

Import `Lock` from `lucide-react` and `RETENTION_POINT_TYPE_ID` from `@/lib/point-types`. The disabled branch renders no input, so the id is absent from `activeIds` on submit — confirm the parser treats a missing id as "unchanged" for this row rather than "deactivate". If it does not, emit a hidden input carrying the id.

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/admin/system/point-types/
git commit -m "feat(admin): show retention as a locked, permanent point type"
```

---

### Task 10: Member-facing Points page

**Files:**
- Modify: `src/app/portal/events/page.tsx:44-58, :61-63, :69, :91-114`

- [ ] **Step 1: Replace the leaderboard selection logic**

Delete the `leaderboardSelection` block (`:44-58`) including its comment. `publicLeaderboard` now takes `pointTypeId` directly:

```tsx
const leaderboard =
	view === "leaderboard" && pointTypeLoad.ok && selectedTermId && selectedPointTypeId
		? await repositories.retention
				.publicLeaderboard(actor, { termId: selectedTermId, pointTypeId: selectedPointTypeId, limit: 25 })
				.catch(() => [])
		: [];
```

- [ ] **Step 2: Retitle**

`h1` from `Retention` to `Points`. Subhead to `Your points and where you stand this term.` Tab labels from `My history` / `Leaderboard` to `My points` / `Leaderboard`.

- [ ] **Step 3: Move the point-type filter above the tab content**

The `<form>` currently rendered only in the leaderboard branch (`:97-114`) moves above the `view === "history"` conditional so it applies to both tabs, with its hidden `view` input bound to the current `view`. Pass `selectedPointTypeId` into `RetentionHistory` so the history list filters to the chosen type.

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/portal/events/page.tsx src/components/retention-history.tsx
git commit -m "feat(portal): rename the retention page to points and filter history by type"
```

---

# Phase 4 — Reporting repository

### Task 11: Event-shaped read models

**Files:**
- Create: `src/db/repositories/attendance-reports.ts`, `src/db/repositories/attendance-reports.integration.test.ts`

**Interfaces:**
- Consumes: `attendanceStatus`, `minutesLate` from Task 3; `DEFAULT_GRACE_MINUTES` from Task 2
- Produces: `createAttendanceReports(db)` returning `{ termEventSummaries, eventRoster }`

This module takes a `Db` handle directly and is **not** registered in `createDrizzleRepositories` or `createSharedRepositories`, matching `src/app/portal/admin/data/retention/data.ts`. `getDb()` throws in shared mode, so the admin section does not work there today and will not after this change. That is a documented pre-existing gap, not a regression.

- [ ] **Step 1: Write the failing test**

Create `src/db/repositories/attendance-reports.integration.test.ts`:

```ts
import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { createAttendanceReports } from "./attendance-reports";
import { attendanceStatus } from "@/lib/attendance-status";
import type { Actor } from "@/server/auth/permissions";

const admin = { memberId: "mem_admin", roles: ["super_admin"], context: "session" } as Actor;
const outsider = { memberId: "mem_out", roles: [], context: "session" } as Actor;

describe("attendance reports", () => {
	it("refuses an actor without retention:record", async () => {
		const reports = createAttendanceReports(drizzle(env.DB, { schema }));
		await expect(reports.termEventSummaries(outsider, "term_1")).rejects.toThrow("Not authorized");
	});

	it("counts late and absent against the event grace window", async () => {
		const db = drizzle(env.DB, { schema });
		const reports = createAttendanceReports(db);
		// seedEvent starts 10:00, grace 15. One scan at 10:10 (on time), one at 10:30 (late),
		// one member RSVP'd going with no scan (absent).
		await seedFixture(db);

		const [summary] = await reports.termEventSummaries(admin, "term_1");
		expect(summary.attendedCount).toBe(2);
		expect(summary.lateCount).toBe(1);
		expect(summary.absentCount).toBe(1);
	});

	it("agrees with the shared status function on every roster row", async () => {
		const db = drizzle(env.DB, { schema });
		const reports = createAttendanceReports(db);
		await seedFixture(db);

		const roster = await reports.eventRoster(admin, "evt_1");
		const lateFromTs = roster.filter(
			(row) => row.scannedAt && attendanceStatus(row.scannedAt, row.startsAt, row.graceMinutes) === "late",
		).length;
		const [summary] = await reports.termEventSummaries(admin, "term_1");
		expect(lateFromTs).toBe(summary.lateCount);
	});
});
```

Write `seedFixture(db)` in the same file: insert one term, one approved event (`startsAt` 10:00 UTC, `graceMinutes` 15), three members, two `crs_attendance` rows at 10:10 and 10:30, and one `event_rsvps` row with `state: "going"` for the third member.

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/db/repositories/attendance-reports.integration.test.ts`
Expected: FAIL — cannot resolve `./attendance-reports`.

- [ ] **Step 3: Implement the module**

Create `src/db/repositories/attendance-reports.ts`. Gate every function on `retention:record`:

```ts
import { and, eq, inArray, sql } from "drizzle-orm";
import { crsAttendance, crsEvents, eventPointAwards, eventRsvps, members, retentionRecords } from "@/db/schema";
import { DEFAULT_GRACE_MINUTES } from "@/lib/point-types";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

const requireReporting = (actor: Actor) => {
	if (!can(actor, "retention:record")) throw new Error("Not authorized to read attendance reports.");
};

/**
 * SQL mirror of `attendanceStatus`. Aggregate counts cannot call the TS function, so the
 * comparison is duplicated here — narrowly, and covered by a test asserting the two agree.
 */
const lateExpr = sql`
	${crsAttendance.scannedAt} >
	${crsEvents.startsAt} + coalesce(${crsEvents.graceMinutes}, ${DEFAULT_GRACE_MINUTES}) * 60000
`;

export function createAttendanceReports(db: Db) {
	return {
		async termEventSummaries(actor: Actor, termId: string) { /* ... */ },
		async eventRoster(actor: Actor, eventId: string) { /* ... */ },
	};
}
```

`termEventSummaries` selects the event columns plus three aggregates: `count(crs_attendance.member_id)` for attended, `sum(case when <lateExpr> then 1 else 0 end)` for late, and a correlated count of `event_rsvps` rows with `state = 'going'` having no matching attendance row for absent. It scopes to events whose `startsAt` falls inside the term's window and whose `deletedAt` is null.

`eventRoster` left-joins `crs_attendance` and `event_rsvps` to `members` for one event, returning `startsAt` and `graceMinutes` on every row so the caller derives per-row status with the TS function. It also joins `members` a second time via an alias on `crs_attendance.scannedBy` to return `scannedById` and `scannedByName`, following the `scannerMember` alias pattern already at `events.ts:183`.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/db/repositories/attendance-reports.integration.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/db/repositories/attendance-reports.ts src/db/repositories/attendance-reports.integration.test.ts
git commit -m "feat(reports): add bounded event attendance read models"
```

---

### Task 12: Member-shaped read models and the scan log

**Files:**
- Modify: `src/db/repositories/attendance-reports.ts`, `src/db/repositories/attendance-reports.integration.test.ts`

**Interfaces:**
- Produces: `termMemberSummaries(actor, termId, { q?, limit, offset })`, `memberAttendance(actor, memberId, termId)`, `scanLog(actor, termId, { eventId?, scannerId?, memberId?, limit, offset })`

`scanLog` reads `auditLogs` directly, **not** `audit.list`. `audit.list` gates on `hasAnyAdminScope`, which is broader than `retention:record`; routing through it would widen who can read attendance history to every admin scope.

- [ ] **Step 1: Write the failing tests**

Add to the same test file:

```ts
it("caps limit at 200 however large the request", async () => {
	const db = drizzle(env.DB, { schema });
	const reports = createAttendanceReports(db);
	await seedManyMembers(db, 250);
	const rows = await reports.termMemberSummaries(admin, "term_1", { limit: 5000, offset: 0 });
	expect(rows.length).toBeLessThanOrEqual(200);
});

it("filters members by name or email", async () => {
	const db = drizzle(env.DB, { schema });
	const reports = createAttendanceReports(db);
	await seedFixture(db);
	const rows = await reports.termMemberSummaries(admin, "term_1", { q: "target", limit: 50, offset: 0 });
	expect(rows.every((row) => `${row.fullName ?? ""}${row.email}`.toLowerCase().includes("target"))).toBe(true);
});

it("keeps an undone scan visible in the scan log", async () => {
	const db = drizzle(env.DB, { schema });
	const reports = createAttendanceReports(db);
	await seedFixture(db);
	await seedUndo(db, { eventId: "evt_1", memberId: "mem_late", actorMemberId: "mem_admin" });

	const rows = await reports.scanLog(admin, "term_1", { limit: 50, offset: 0 });
	expect(rows.some((row) => row.action === "event:undo_scan" && row.memberId === "mem_late")).toBe(true);
});
```

`seedUndo` deletes the attendance row and inserts an `audit_logs` row with `action: "event:undo_scan"` and `targetMemberId`, reproducing what `undoScan` does after Task 5.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run src/db/repositories/attendance-reports.integration.test.ts`
Expected: FAIL — the three functions do not exist.

- [ ] **Step 3: Implement the three functions**

Add a shared clamp:

```ts
const clampLimit = (limit: number) => Math.min(Math.max(1, Math.floor(limit)), 200);
```

`termMemberSummaries` groups attendance by member across the term's events, counting rows and late rows via `lateExpr`, left-joining `retention_records` grouped by point type for `pointsByType`. `q` matches `members.fullName`, `members.name`, `members.email` with `like` and `lower(...)` on both sides.

`memberAttendance` returns one row per event in the term that the member either attended or RSVP'd `going` to, carrying `startsAt`, `graceMinutes`, `scannedAt | null`, `rsvpState`, and `pointsEarned`.

`scanLog` selects from `auditLogs` where `category = 'event'` and `action in ('event:scan_attendance','event:undo_scan')`, joins `members` on `targetMemberId` for the scanned member and again via alias on `actorMemberId` for who did it, joins `crsEvents` on `targetId` for title/`startsAt`/`graceMinutes`, scopes to the term window by `crsEvents.startsAt`, orders by `createdAt desc`, and applies the optional filters plus `clampLimit`.

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/db/repositories/attendance-reports.integration.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/db/repositories/attendance-reports.ts src/db/repositories/attendance-reports.integration.test.ts
git commit -m "feat(reports): add member summaries, member attendance, and the scan log"
```

---

# Phase 5 — Admin interface

### Task 13: Attendance status cell

**Files:**
- Create: `src/components/portal/attendance-status-cell.tsx`

**Interfaces:**
- Consumes: `attendanceStatus`, `minutesLate` from Task 3
- Produces: `<AttendanceStatusCell scannedAt startsAt graceMinutes />`

On time renders nothing. Badging the majority case builds a wall of badges carrying no information; only exceptions get marks. The palette has no red/amber/green, so status is encoded by weight and a literal number instead of hue.

- [ ] **Step 1: Write the component**

```tsx
import { Badge } from "@/components/ui/badge";
import { attendanceStatus, minutesLate } from "@/lib/attendance-status";

export function AttendanceStatusCell({
	scannedAt,
	startsAt,
	graceMinutes,
}: {
	scannedAt: Date | null;
	startsAt: Date;
	graceMinutes: number | null;
}) {
	if (!scannedAt) {
		return <span className="text-xs text-muted-foreground">Absent</span>;
	}
	if (attendanceStatus(scannedAt, startsAt, graceMinutes) === "on_time") {
		// On time is the majority case and carries no exception. Rendering a badge for it
		// would add noise to every row without adding information.
		return null;
	}
	return (
		<Badge variant="warn" className="tabular-nums">
			+{minutesLate(scannedAt, startsAt, graceMinutes)} min
		</Badge>
	);
}
```

- [ ] **Step 2: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS. No render test — the Workers pool cannot render components; the logic it depends on is covered by Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/components/portal/attendance-status-cell.tsx
git commit -m "feat(portal): add exception-first attendance status cell"
```

---

### Task 14: Grace period inputs

**Files:**
- Modify: `src/app/portal/calendar/create-event-sheet.tsx`, `src/app/portal/calendar/[eventId]/event-manage-panel.tsx`, plus the input parser each submits to
- Test: sibling of `src/app/portal/calendar/[eventId]/award-editor-input.test.ts`

- [ ] **Step 1: Write the failing parser test**

```ts
it("accepts a blank grace period as null", () => {
	expect(parseGraceMinutes("")).toBeNull();
});

it("rejects a grace period outside 0 to 240", () => {
	expect(() => parseGraceMinutes("-1")).toThrow();
	expect(() => parseGraceMinutes("241")).toThrow();
});

it("accepts a whole number of minutes", () => {
	expect(parseGraceMinutes("20")).toBe(20);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/app/portal/calendar` — Expected: FAIL, `parseGraceMinutes` undefined.

- [ ] **Step 3: Implement and wire the input**

```ts
export function parseGraceMinutes(raw: FormDataEntryValue | null): number | null {
	const value = typeof raw === "string" ? raw.trim() : "";
	if (!value) return null;
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 0 || parsed > 240) {
		throw new Error("Grace period must be a whole number of minutes between 0 and 240.");
	}
	return parsed;
}
```

Add to both forms:

```tsx
<label className="grid gap-1.5 text-sm">
	<span className="font-medium">Grace period (minutes)</span>
	<Input name="graceMinutes" type="number" min={0} max={240} placeholder="15" defaultValue={event?.graceMinutes ?? ""} />
	<span className="text-xs text-muted-foreground">Members scanned after this many minutes are marked late. Blank uses 15.</span>
</label>
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/app/portal/calendar && pnpm typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/portal/calendar/
git commit -m "feat(events): let organizers set a per-event grace period"
```

---

### Task 15: Overview route

**Files:**
- Modify: `src/app/portal/admin/data/page.tsx`

**Interfaces:**
- Consumes: `termEventSummaries`, `termMemberSummaries`, `scanLog` from Tasks 11-12

- [ ] **Step 1: Replace the page body**

Keep the term selector and the header actions (Point types, Export, `ManualRecordSheet`). Replace `<EventsPointsDashboard .../>` with:

1. The existing four-metric row from `summarizeDashboard`.
2. A **Needs attention** section: three lists, each capped at 5 with a "see all" link — approved events that have ended with zero attendance; events with `event_point_awards` rows but zero scans; members below `terms.probationBelow`.
3. The five most recent `scanLog` rows, linking to `/portal/admin/data/scans`.

Subhead: `What needs your attention this term.`

- [ ] **Step 2: Apply the density rules**

Section labels use `text-sm font-semibold uppercase tracking-[0.08em]` in Source Sans, not `font-heading text-2xl`. Unna (`font-heading`) stays on the page `h1` only. Table rows use `py-2.5`.

- [ ] **Step 3: Empty states**

If a Needs-attention list is empty, render one muted line saying so, for example `No events ended without attendance.` Do not hide the section — its emptiness is the useful signal.

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/portal/admin/data/page.tsx
git commit -m "feat(admin): replace the events dashboard with a needs-attention overview"
```

---

### Task 16: Events list and event roster routes

**Files:**
- Create: `src/app/portal/admin/data/events/page.tsx`, `src/app/portal/admin/data/events/[id]/page.tsx`

- [ ] **Step 1: Build the events list**

Subhead: `How each event turned out.` Columns: event, date, type, status, attended, late, absent, points issued. Counts use `tabular-nums`. Search is a GET form filtering server-side by title, place, and type. Row title links to `./events/[id]`.

- [ ] **Step 2: Build the event roster**

Subhead: `Who attended, and who was late.` Header shows title, date, place, type, grace period, and counts.

Attendee table columns: member, scanned at, status (`<AttendanceStatusCell>`), scanned by, points from this event. Member cells use `min-w-0` + `break-all`.

Absent members render **below** the attendee table behind a `<details>` disclosure labelled `Show N absent`, so the attended list stays clean. Use native `<details>`, not a state-driven modal.

- [ ] **Step 3: Teaching empty states**

Zero scans and no scanner assigned to the event: say so and link to the event's staff panel at `/portal/calendar/[id]`. Zero scans with a scanner assigned: state that check-in opens 30 minutes before the start, and give the time.

- [ ] **Step 4: Guard both routes**

```ts
const actor = await requireActor();
if (!can(actor, "retention:record")) notFound();
```

before any query runs.

- [ ] **Step 5: Verify and commit**

Run: `pnpm typecheck && pnpm lint` — Expected: PASS.

```bash
git add src/app/portal/admin/data/events/
git commit -m "feat(admin): add the events list and event roster routes"
```

---

### Task 17: Members, scan log, and ledger routes

**Files:**
- Create: `src/app/portal/admin/data/members/page.tsx`, `src/app/portal/admin/data/scans/page.tsx`, `src/app/portal/admin/data/ledger/page.tsx`

- [ ] **Step 1: Members list**

Subhead: `Who is participating, and who is short.` Columns: member, events attended, late count, points by type, total. Server-side search, paginated at 50. Row links to `/portal/admin/members/[id]`.

- [ ] **Step 2: Scan log**

Subhead: `What happened at the door, and who did it.` Columns: time, member, event, action, status, actor. Filters for event, scanner, member, and date range as a GET form.

Rows with `action === "event:undo_scan"` render struck-through with the reversing actor named, so a scan and its reversal read as one story rather than an absence.

- [ ] **Step 3: Ledger**

Subhead: `Where every point came from.` Move the existing ledger table out of `events-points-dashboard.tsx`, replacing the client-side `.filter()` with a server-side search param and pagination at 50.

- [ ] **Step 4: Parse every filter with Zod**

```ts
const querySchema = z.object({
	q: z.string().trim().max(100).optional(),
	page: z.coerce.number().int().min(1).max(10_000).catch(1),
	eventId: z.string().max(60).optional(),
});
```

Never pass an unvalidated search param into a query.

- [ ] **Step 5: Verify and commit**

Run: `pnpm typecheck && pnpm lint` — Expected: PASS.

```bash
git add src/app/portal/admin/data/members/ src/app/portal/admin/data/scans/ src/app/portal/admin/data/ledger/
git commit -m "feat(admin): add members, scan log, and ledger routes"
```

---

### Task 18: Register navigation and delete the old dashboard

**Files:**
- Modify: `src/app/portal/admin/nav.ts:44-66`, `src/app/portal/admin/nav.test.ts`
- Delete: `src/app/portal/admin/data/events-points-dashboard.tsx`, `src/app/portal/admin/data/retention/page.tsx`, `loadAttendance` in `src/app/portal/admin/data/retention/data.ts`

- [ ] **Step 1: Write the failing nav test**

```ts
it("gates every events and points page on retention:record", () => {
	const group = adminGroups.find((g) => g.segment === "data");
	const segments = group!.pages.map((page) => page.segment);
	expect(segments).toEqual([
		"dashboard", "events", "members", "scans", "ledger", "event-types", "point-types", "exports",
	]);
	for (const page of group!.pages) {
		if (["events", "members", "scans", "ledger"].includes(page.segment)) {
			expect(page.permission).toBe("retention:record");
		}
	}
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm vitest run src/app/portal/admin/nav.test.ts` — Expected: FAIL.

- [ ] **Step 3: Register the pages**

Insert four entries into the `G("data", ...)` group after `dashboard`, keeping `event-types`, `point-types`, and `exports` last:

```ts
{ segment: "events", label: "Events", description: "How each event turned out.", permission: "retention:record" },
{ segment: "members", label: "Members", description: "Attendance and points per member.", permission: "retention:record" },
{ segment: "scans", label: "Scan Log", description: "Every check-in and reversal, and who did it.", permission: "retention:record" },
{ segment: "ledger", label: "Ledger", description: "Every point record this school year.", permission: "retention:record" },
```

Change the `dashboard` entry's description to `What needs your attention this term.`

- [ ] **Step 4: Delete the replaced files**

Remove `events-points-dashboard.tsx`, `data/retention/page.tsx`, and the `loadAttendance` export from `data/retention/data.ts`. Keep `loadRetentionPickers` — `ManualRecordSheet` still uses it. Delete `dashboard-summary.ts` only if nothing imports it after Task 15.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm vitest run && pnpm typecheck && pnpm lint` — Expected: all PASS.

```bash
git add -A src/app/portal/admin/
git commit -m "feat(admin): register the events and points routes, drop the old dashboard"
```

---

### Task 19: Member profile route

**Files:**
- Create: `src/app/portal/admin/members/[id]/page.tsx`

**Interfaces:**
- Consumes: `memberAttendance` from Task 12; `RetentionProgress` from `@/components/portal/overview-metrics`

- [ ] **Step 1: Build the page**

Five sections: header (full name, email, status, roles); retention progress for the term against `terms.retainedAt` and `terms.probationBelow`, reusing `RetentionProgress`; points by type for every type with a nonzero total; events attended from `memberAttendance` with `<AttendanceStatusCell>` per row, including RSVP'd-but-absent rows; and that member's ledger records, paginated.

Include the same term selector used across the section.

- [ ] **Step 2: Guard**

```ts
const actor = await requireActor();
if (!can(actor, "retention:record")) notFound();
```

A member's own equivalent already exists at `/portal/events`, so there is no self-access fallback here.

- [ ] **Step 3: Link from the members list**

Confirm Task 17's members list rows link here.

- [ ] **Step 4: Verify and commit**

Run: `pnpm typecheck && pnpm lint` — Expected: PASS.

```bash
git add src/app/portal/admin/members/
git commit -m "feat(admin): add the member attendance and points profile"
```

---

# Phase 6 — Scanner

### Task 20: Scanner activation panel

**Files:**
- Modify: `src/app/portal/page.tsx:29-45, :143-149`, `src/components/event-scan-panel.tsx`

- [ ] **Step 1: Support multiple live events**

`page.tsx:38` uses `.find()` and silently drops a second live event where the actor is a scanner. Change to `.filter()`:

```tsx
const scanEvents_live = scanEvents.filter(
	(event) =>
		event.myRole === "scanner" &&
		event.endsAt !== null &&
		now.getTime() >= event.startsAt.getTime() - CHECKIN_LEAD_MS &&
		now.getTime() <= event.endsAt.getTime(),
);
```

- [ ] **Step 2: Move the panel to the top**

Delete the `{scanEvent && currentTerm ? ... }` block at `:143-149`. Render directly beneath the greeting and above the metric grid:

```tsx
{currentTerm
	? scanEvents_live.map((event) => (
			<EventScanPanel
				key={event.id}
				eventId={event.id}
				eventTitle={event.title}
				termId={currentTerm.id}
				closesAt={event.endsAt}
				canUndo={canUndo}
			/>
		))
	: null}
```

- [ ] **Step 3: Make the panel the one loud surface**

In `event-scan-panel.tsx`, replace the neutral `Card` with an accent-filled panel: `bg-accent text-accent-foreground`, full width. The open-scanner control gets `min-h-11` for a 44px touch target — this is used one-handed, standing, on a phone. Show the live scanned count and the closing time in plain words:

```tsx
<p className="text-sm text-accent-foreground/80">Check-in is open until {formatTime(closesAt)}.</p>
```

Everything else in the admin and portal surfaces stays restrained; this panel is time-boxed and appears on its own, so it earns the emphasis.

- [ ] **Step 4: Verify and commit**

Run: `pnpm typecheck && pnpm lint` — Expected: PASS.

```bash
git add src/app/portal/page.tsx src/components/event-scan-panel.tsx
git commit -m "feat(portal): surface the scanner prompt at the top of the dashboard"
```

---

### Task 21: Let scanners undo their own scan

**Files:**
- Modify: `src/db/repositories/events.ts:634-640`, `src/components/event-scan-panel.tsx`, `src/app/portal/page.tsx`
- Delete: `src/server/internal/events.ts:145-150`
- Test: `src/db/repositories/events.integration.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it("lets a scanner undo a scan they recorded", async () => {
	const { events } = await makeRepos();
	await events.recordScan(scanner, { eventId: EVENT_ID, memberId: "mem_target", termId: TERM_ID });
	await expect(events.undoScan(scanner, { eventId: EVENT_ID, memberId: "mem_target" })).resolves.toEqual({ removed: true });
});

it("stops a scanner undoing a scan another member recorded", async () => {
	const { events } = await makeRepos();
	await events.recordScan(owner, { eventId: EVENT_ID, memberId: "mem_target", termId: TERM_ID });
	await expect(events.undoScan(scanner, { eventId: EVENT_ID, memberId: "mem_target" })).rejects.toThrow("Not authorized");
});

it("lets an event admin undo a scan they did not record", async () => {
	const { events } = await makeRepos();
	await events.recordScan(scanner, { eventId: EVENT_ID, memberId: "mem_target", termId: TERM_ID });
	await expect(events.undoScan(adminStaff, { eventId: EVENT_ID, memberId: "mem_target" })).resolves.toEqual({ removed: true });
});
```

The existing test at `events.integration.test.ts:567` asserting a scanner cannot undo **stays and must keep passing** — the scanner there attempts to undo the *owner's* scan, which the new rule still forbids.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run src/db/repositories/events.integration.test.ts -t "undo"`
Expected: the first new test FAILS with `Not authorized to undo attendance.`

- [ ] **Step 3: Widen the rule by exactly one row**

In `undoScan`, load the row before the permission check and allow the scanner who created it:

```ts
const existing = await loadScanRow(db, input.eventId, input.memberId);
if (!existing) return { removed: false };
// A scanner may reverse only the row they created; anything wider needs manage rights.
const ownScan = existing.scannedBy === actor.memberId;
if (!ownScan && !canManage(role, actor)) throw new Error("Not authorized to undo attendance.");
```

Confirm `loadScanRow` returns `scannedBy`; add it to the select if not.

- [ ] **Step 4: Gate the UI to environments that support it**

Undo cannot work through the shared dev Worker: `src/app/internal/events/route.ts` exports no `DELETE`, so a request 405s before reaching any handler. Pass `canUndo={getAppConfig().APP_ENV !== "shared"}` from `page.tsx` and keep hiding the button when false, rather than offering an action that fails.

Delete the unreachable deny-branch at `src/server/internal/events.ts:145-150`. It documents an intent the route file does not implement, and leaving it invites someone to trust it.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm vitest run && pnpm typecheck && pnpm lint` — Expected: all PASS.

```bash
git add src/db/repositories/events.ts src/server/internal/events.ts src/components/event-scan-panel.tsx src/app/portal/page.tsx src/db/repositories/events.integration.test.ts
git commit -m "feat(events): let a scanner reverse their own scan"
```

---

# Phase 7 — Deploy

### Task 22: Pre-flight, deploy, then drop the column

**Files:**
- Create: `drizzle/migrations/0015_drop_counts_toward_retention.sql`

> Every command here touches a real database. Show it and get approval before running it. Do not batch these steps.

- [ ] **Step 1: Audit the flag on dev and production**

Show and get approval for:

```bash
pnpm exec wrangler d1 execute code-portal-dev --remote --command "select id, key, label, counts_toward_retention from point_types"
```

Any type other than `pt_retention` with the flag set loses its retention contribution. If one exists, stop and decide per type — merge its records into `pt_retention`, or accept the drop — and record the decision before continuing. Repeat for production.

- [ ] **Step 2: Confirm dev migration state**

```bash
pnpm exec wrangler d1 migrations list code-portal-dev --remote
```

Local migrations run to `0013`; dev D1 was last verified at `0010`. Reconcile the gap before applying `0014`.

- [ ] **Step 3: Apply 0014 and deploy**

```bash
pnpm db:migrate:dev
```

then

```bash
pnpm deploy:dev
```

`0014` is additive, so the old code is unaffected while it lands.

- [ ] **Step 4: Verify the deployed app before dropping anything**

Check on the deployed dev Worker: the admin Events & Points routes load; a scan records and appears in the scan log; retention totals match what they were before the deploy. Do not proceed until they do.

- [ ] **Step 5: Write and apply 0015**

Create `drizzle/migrations/0015_drop_counts_toward_retention.sql`:

```sql
ALTER TABLE `point_types` DROP COLUMN `counts_toward_retention`;
```

If D1's SQLite rejects `DROP COLUMN`, replace it with the table rebuild pattern from `0013_additive_points_schema.sql`: create `point_types_new` without the column, `INSERT ... SELECT`, drop the original, rename.

This migration is cosmetic. If anything looks wrong at Step 4, leave it unapplied indefinitely — nothing depends on the column being gone.

- [ ] **Step 6: Commit**

```bash
git add drizzle/migrations/0015_drop_counts_toward_retention.sql
git commit -m "chore(db): drop the counts_toward_retention column"
```

---

## Self-Review

**Spec coverage.** §1 → Tasks 1, 2, 6, 7, 8, 9, 10, 22. §2 → Tasks 1, 3, 14. §3 → Tasks 11, 12. §4 → Tasks 15, 16, 17, 18. §5 → Task 19. §6 → Tasks 20, 21. §7 → Tasks 13, 15, 16, 17, 20 (density, exception-first status, teaching empty states, the one loud surface). Audit layer → Tasks 4, 5. Pre-flight and phasing → Task 22.

**Type consistency.** `RETENTION_POINT_TYPE_ID` and `DEFAULT_GRACE_MINUTES` are defined in Task 2 and imported by Tasks 3, 6, 7, 8, 9, 11. `attendanceStatus` / `minutesLate` are defined in Task 3 and consumed by Tasks 11, 13. `createAttendanceReports` is defined in Task 11 and extended in Task 12; its five functions are consumed by Tasks 15-17, 19. `AuditRecordInput.targetMemberId` is added in Task 4 and used in Tasks 5 and 12.

**Known gap, deliberate.** The admin Events & Points section does not work in shared development mode. `getDb()` throws there and the pages this replaces already call it directly, so this is pre-existing, not a regression. Recorded under "Known debt" in the spec.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-30-events-points-admin.md`. Two execution options:

**1. Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
