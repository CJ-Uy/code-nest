# Events & Points — Admin Monitoring, Late Tracking, Retention De-specialization

Date: 2026-07-30
Status: Draft (awaiting review)
Branch: `beta`
Migration: `0014`

## Problem

The events & points system works but is hard to operate.

**Admin side.** `/portal/admin/data` is a single page with four stacked slabs: a metric row,
an events table, an attendance detail table for one selected event, and a global points ledger.
The page answers "who came to this event" and nothing else. It cannot answer:

- Which events has this member attended?
- Who arrived late, to any event, ever?
- Who scanned this person in?
- Which approved events ended with zero attendance?

**Performance.** `src/app/portal/admin/data/page.tsx` loads every attendance row and every point
record for the whole school year and serializes them into a client component, which filters in the
browser. At 200 events x 60 members that is roughly 12,000 rows per page load, with no pagination.
The UI shape mirrors the loading strategy: because all data is already client-side, the cheapest
render was "three big tables." Fixing the IA without fixing the loading just moves the dump around.

**Scanner activation.** `EventScanPanel` renders last on the member dashboard
(`src/app/portal/page.tsx:143`), below metrics, announcements, and library. A scanner standing at a
door has to scroll past everything to find it.

**Retention.** Retention is modelled as a cross-cutting property (`point_types.counts_toward_retention`)
rather than a point type. The consequences leak everywhere: a discriminated union in the leaderboard
repo, a save-time validator that refuses any configuration without an active retention-counting type,
a `Retention` badge in the point-types manager, and a member-facing page titled "Retention" that is
really the points page.

## Goals

1. Retention becomes an ordinary point type that always exists and cannot be retired.
2. Attendance records lateness, defined per event.
3. Admin can pivot attendance three ways: by event, by member, by scan.
4. Scanners are told they can scan, at the top of their dashboard, and can undo their own mistakes.
5. Every admin query is bounded — filtered and paginated server-side.

## Non-goals

- Renaming the `retention_records` table or `retention.ts` repository. The table is the generic
  points ledger and the name is wrong, but renaming touches every import for zero functional gain.
  User-facing copy carries the fix instead. Logged as debt in "Known debt" below.
- Reworking the member-facing events/calendar UI beyond the retitle in §1.
- Attendance for non-members / guests.
- Notifications, push, or email for scanner activation. Dashboard placement only.

## Locked decisions

| Decision | Choice | Rejected |
|---|---|---|
| Retention semantics | Drop `counts_toward_retention`. Retention progress = sum of records whose `point_type_id = 'pt_retention'`. | Keeping the flag with multiple contributing types; pooling all types into one total. |
| Lateness | Per-event `grace_minutes`, nullable, default 15. Status derived at read time, never stored. | Global-only setting; grace on `event_type_rules`. |
| Member profile location | New route `/portal/admin/members/[id]`. | Tab inside Events & Points; side drawer from member names. |
| Admin IA | Section with sibling routes (Overview / Events / Members / Scan log / Ledger). | Single page with drawers; pushing rosters onto `/portal/calendar/[eventId]`. |

---

## §1 — Retention de-specialization

### Schema

Migration `0014`:

```sql
ALTER TABLE point_types DROP COLUMN counts_toward_retention;
ALTER TABLE crs_events ADD COLUMN grace_minutes INTEGER;
```

`retention_records.point_type_id` keeps its `'pt_retention'` default — it is now a plain FK default,
not a special case.

`DROP COLUMN` requires SQLite 3.35+ and fails on a column referenced by an index, view, or partial-index
`WHERE`. `counts_toward_retention` has no index in `schema.ts`, but D1's SQLite version and the actual
applied DDL must be confirmed on dev before this runs (see "Pre-flight"). If `DROP COLUMN` is
unavailable, fall back to the twelve-step table rebuild: create `point_types_new` without the column,
`INSERT ... SELECT`, drop, rename — inside one transaction, matching the pattern already used in
`0013_additive_points_schema.sql`.

### Constants

New file `src/lib/point-types.ts`:

```ts
export const RETENTION_POINT_TYPE_ID = "pt_retention";
export const DEFAULT_GRACE_MINUTES = 15;
```

### Repository changes

Every `eq(pointTypes.countsTowardRetention, true)` predicate becomes
`eq(retentionRecords.pointTypeId, RETENTION_POINT_TYPE_ID)`:

- `src/db/repositories/retention.ts:167` — `memberTermSummary`
- `src/db/repositories/retention.ts:202` — `leaderboard`
- `src/db/repositories/retention.ts:217` — `publicLeaderboard`
- `src/db/repositories/retention.ts:373` — `myHistory` totals
- `src/db/repositories/overview.ts:59` — dashboard retention metric

Where the predicate was the *only* reason for the `pointTypes` join, drop the join.

Delete the `PublicLeaderboardSelection` discriminated union
(`src/db/repositories/retention.ts:51-56`). `publicLeaderboard` takes a plain
`pointTypeId: string`. Retention is one option among many in the dropdown.

`src/app/portal/profile/point-breakdown.ts:24` currently derives a `retention: boolean` per type
from the flag. It becomes `type.id === RETENTION_POINT_TYPE_ID`.

### Permanence

`pointTypes.update` and the bulk save action reject any mutation that would:

- set `active = false` on `pt_retention`
- change `pt_retention`'s `key`
- delete `pt_retention`

`label` and `position` stay editable. Error message: `"The Retention point type cannot be retired or renamed."`

This replaces the validator at `src/app/portal/admin/system/point-types/input.ts:50`
("At least one active point type must count toward retention"), which is meaningless once the flag
is gone.

### UI

- `point-types-manager.tsx`: remove the `countsTowardRetention` checkbox (lines 43-46, 173-181) and
  the `Retention` badge (line 134). The `pt_retention` row instead shows a lock icon and a disabled
  retire toggle, with hover text explaining why.
- `src/app/portal/events/page.tsx`: page title `Retention` → `Points`. Tabs `My history` /
  `Leaderboard` → `My points` / `Leaderboard`. The point-type filter, currently leaderboard-only,
  also applies to the history tab.
- `src/app/portal/page.tsx`: the `MetricCard label="Retention"` stays. It names the point type, which
  is now correct rather than special.

### Migration risk

If any point type other than `pt_retention` currently has `counts_toward_retention = 1`, its points
silently stop counting toward retention after `0014`. Seed data
(`src/db/seed/data.ts:42-44`) has only `pt_retention` set, but dev and production D1 must be checked
before the migration runs. See "Pre-flight" below.

---

## §2 — Late tracking

### Schema

`crs_events.grace_minutes INTEGER` nullable (added in `0014` above). `NULL` means use
`DEFAULT_GRACE_MINUTES`.

### Derivation

New pure module `src/lib/attendance-status.ts`:

```ts
export type AttendanceStatus = "on_time" | "late";

export function attendanceStatus(
  scannedAt: Date,
  startsAt: Date,
  graceMinutes: number | null,
): AttendanceStatus {
  const grace = (graceMinutes ?? DEFAULT_GRACE_MINUTES) * 60_000;
  return scannedAt.getTime() > startsAt.getTime() + grace ? "late" : "on_time";
}
```

Status is computed at read time, never persisted. If an organizer corrects a wrong `startsAt` or
adjusts the grace window, every historical flag self-corrects. Persisting would freeze bad data and
require a backfill on every correction.

`CHECKIN_LEAD_MS` (30 min, `src/db/repositories/events.ts:28`) already permits scanning before
`startsAt`, so `scannedAt < startsAt` is normal and yields `on_time` with no special branch.

### Third state: absent

A member with `event_rsvps.state = 'yes'` and no `crs_attendance` row is **absent**. Derived from
existing tables, no schema change. Surfaced in the event roster (§4) and member profile (§5).

Members who never RSVP'd and never attended are not "absent" — they are simply not in the roster.

### UI

`grace_minutes` gets a number input labelled "Grace period (minutes)" with placeholder `15` in:

- `src/app/portal/calendar/create-event-sheet.tsx`
- `src/app/portal/calendar/[eventId]/event-manage-panel.tsx`

Blank submits `NULL`. Validation: integer, `0 <= n <= 240`.

### Tests

`src/lib/attendance-status.test.ts` — boundary cases: exactly at `startsAt + grace` is `on_time`;
one ms past is `late`; scan before `startsAt` is `on_time`; `null` grace uses the default.

---

## §3 — New repository: `attendance-reports.ts`

`src/db/repositories/events.ts` is already 731 lines. The cross-cutting reporting queries go in a
new file, `src/db/repositories/attendance-reports.ts`, with one purpose: bounded read models for the
admin console. It owns no writes.

| Function | Input | Returns |
|---|---|---|
| `termEventSummaries` | `actor, termId` | per event: `id, title, type, status, startsAt, place, graceMinutes, attendedCount, lateCount, absentCount, pointsIssued` |
| `termMemberSummaries` | `actor, termId, { q?, limit, offset }` | per member: `memberId, fullName, email, eventsAttended, lateCount, pointsByType[]` |
| `memberAttendance` | `actor, memberId, termId` | rows: `eventId, title, startsAt, graceMinutes, scannedAt \| null, rsvpState, pointsEarned[]` |
| `scanLog` | `actor, termId, { eventId?, scannerId?, memberId?, limit, offset }` | rows: `scannedAt, memberId, memberName, eventId, eventTitle, eventStartsAt, graceMinutes, scannedById, scannedByName` |

All four require `retention:record`. All return `graceMinutes` + `startsAt` so the caller derives
status via `attendanceStatus` rather than duplicating the rule in SQL.

`limit` defaults to 50, hard-capped at 200. `q` matches `members.full_name`, `members.name`,
`members.email` case-insensitively.

`loadAttendance` in `src/app/portal/admin/data/retention/data.ts` is deleted — `termEventSummaries`
and the per-event roster replace it.

### Tests

`src/db/repositories/attendance-reports.integration.test.ts`, Workers pool, `.ts` only, no jsdom.
Covers: permission denial for a non-`retention:record` actor; late/absent counting against a seeded
event; `q` filter; `limit` cap enforcement.

---

## §4 — Admin information architecture

`/portal/admin/data` becomes a section. Each route loads only its own data.

### Routes

| Route | Purpose |
|---|---|
| `data/page.tsx` | **Overview** |
| `data/events/page.tsx` | **Events** — list with attendance/late/points columns |
| `data/events/[id]/page.tsx` | **Event roster** — one event's attendees |
| `data/members/page.tsx` | **Members** — attendance stats per member |
| `data/scans/page.tsx` | **Scan log** — chronological audit |
| `data/ledger/page.tsx` | **Ledger** — the existing points ledger, paginated |

`src/app/portal/admin/data/retention/page.tsx` (a bare redirect to `/portal/admin/data`) is deleted.
`events-points-dashboard.tsx` is decomposed across the new routes and removed.

### Overview

- Metric row: events, check-ins, points issued, manual records (existing `summarizeDashboard`).
- **Needs attention** — three lists, each capped at 5 with a "see all" link:
  - approved events that have ended with zero attendance
  - events with `event_point_awards` configured but zero scans
  - members below `terms.probation_below` for the selected term
- Last 5 scans, linking into the scan log.

The "needs attention" block is the reason the overview exists. A metric row alone does not justify
a page.

### Events list

Columns: event, date, type, status, attended, late, absent, points issued. Row click → event roster.
Search filters server-side by title/place/type.

### Event roster (`data/events/[id]`)

Header: title, date, place, type, grace period, counts.
Table: member, RSVP, scanned at, status badge (`On time` / `Late` / `Absent`), **scanned by**,
points awarded from this event.

`scanned by` is the answer to "who let this person in" and is currently recorded
(`crs_attendance.scanned_by`) but never displayed anywhere.

### Members list

Columns: member, events attended, late count, points by type (compact), total. Server-side search.
Row click → `/portal/admin/members/[id]`.

### Scan log

Chronological, newest first. Columns: time, member, event, status, scanned by.
Filters: event, scanner, member. All server-side, all paginated.

### Ledger

The existing ledger table, moved verbatim, with server-side search and pagination replacing the
client-side `.filter()`.

### Navigation

The new routes register as pages inside the existing `G("data", "Events & Points", [...])` group in
`src/app/portal/admin/nav.ts`. No new nav component; `crumbFor` and `adminHeading` pick them up for
free. Final group order: Overview, Events, Members, Scan log, Ledger, Event Type Rules, Point Types,
Data Exports.

`nav.test.ts` is extended to cover the new pages' permission gating.

---

## §5 — Member profile (`/portal/admin/members/[id]`)

New route under `members/`, not `data/`, because it is useful beyond points.

Sections:

1. **Header** — full name, email, status, roles.
2. **Retention** — points of type `pt_retention` for the selected term, against
   `terms.retained_at` and `terms.probation_below`. Reuses `RetentionProgress`.
3. **Points by type** — every type with a nonzero total.
4. **Events attended** — from `memberAttendance`: event, date, scanned at, status badge, points
   earned. Includes RSVP'd-but-absent rows.
5. **Ledger** — that member's records for the term, paginated.

Term selector matching the rest of the section.

Gated on `retention:record`. A member reaching their own admin profile without that permission gets
`notFound()`; their own data is already at `/portal/events`.

---

## §6 — Scanner activation and scan-system fixes

### Placement

`EventScanPanel` moves from the bottom of `src/app/portal/page.tsx` (line 143, after the library
card) to directly beneath the greeting and above the metric grid. Styling shifts from a plain `Card`
to an accent-filled panel so it reads as an active call to action rather than another widget.

### Multiple concurrent events

`src/app/portal/page.tsx:38` uses `.find()` and silently drops any second live event where the actor
is a scanner. It becomes `.filter()`, rendering one panel per event. Rare, but the failure mode
(silently unable to scan the other event) is bad and the fix is three lines.

### Undo

`src/components/event-scan-panel.tsx:35` hardcodes `canUndo={false}`, and `undoScan`
(`src/db/repositories/events.ts:634`) requires manage rights. Net effect: a scanner who mis-scans at
the door has no recovery path.

Fix, in `undoScan`: permit the delete when `crs_attendance.scanned_by = actor.memberId`, in addition
to the existing manage-rights path. `EventScanPanel` then passes `canUndo={true}`.

No time window. A scanner undoing their own scan an hour later is either correcting a real mistake
or acting maliciously, and a time limit stops neither — the audit log
(`event:scan_attendance` / undo, already written at `src/db/repositories/events.ts:623`) is the
control that matters, and the scan log in §4 now surfaces it.

### Tests

Extend `src/db/repositories/events.integration.test.ts`: a scanner can undo a row they scanned; a
scanner cannot undo a row another member scanned; an event admin can undo either.

---

## Data flow

```
crs_attendance ─┐
crs_events ─────┼─> attendance-reports.ts ─> admin routes ─> attendanceStatus() ─> status badge
event_rsvps ────┤        (bounded SQL)         (server)          (pure fn)
retention_records ┘
```

Status is never computed in SQL. SQL returns raw timestamps plus `starts_at` and `grace_minutes`;
one pure function turns them into a label. One rule, one place, one test file.

## Error handling

- Repository functions throw on permission failure, matching existing convention
  (`throw new Error("Not authorized to ...")`). Routes catch and `notFound()`.
- Admin pages that lack `retention:record` `notFound()` before any query runs.
- Pagination params are parsed with `zod` and clamped, never trusted.
- `attendanceStatus` cannot throw: `null` grace falls back to the default.
- Scanner panel keeps the existing fail-soft behaviour — a failed scan shows a banner, never a crash.

## Testing strategy

All tests run in the Workers pool: `.ts` only, no jsdom, no render tests, no `better-sqlite3` import.

| Area | File | Covers |
|---|---|---|
| Late rule | `src/lib/attendance-status.test.ts` | boundaries, null grace, early scan |
| Reports | `src/db/repositories/attendance-reports.integration.test.ts` | permissions, late/absent counts, search, limit cap |
| Retention de-special | `src/db/repositories/retention.integration.test.ts` (extend) | totals use `pt_retention` only; leaderboard by arbitrary type |
| Permanence | `src/db/repositories/pointTypes.integration.test.ts` (extend) | cannot retire, rename-key, or delete `pt_retention` |
| Undo | `src/db/repositories/events.integration.test.ts` (extend) | scanner undoes own scan; cannot undo another's |
| Nav | `src/app/portal/admin/nav.test.ts` (extend) | new pages gated on `retention:record` |
| Grace input | `src/app/portal/calendar/[eventId]/award-editor-input.test.ts` or sibling | grace parse + range validation |

## Pre-flight

Both must clear before `0014` is applied anywhere.

1. **Audit the flag on every environment.** Any type other than `pt_retention` with the flag set
   loses its retention contribution silently.

   ```bash
   pnpm exec wrangler d1 execute code-portal-dev --remote --command "select id, key, label, counts_toward_retention from point_types"
   ```

   Repeat for production. If another type is flagged, decide per type: merge its records into
   `pt_retention`, or accept the drop. Record the decision before migrating.

2. **Confirm dev D1 migration state.** Local migrations run to `0013`; dev D1 was last verified at
   `0010`.

   ```bash
   pnpm exec wrangler d1 migrations list code-portal-dev --remote
   ```

Per `CLAUDE.md`, the exact `pnpm exec wrangler` command is shown and approved before any D1 write.
Deploy order after approval: `pnpm db:migrate:dev` then `pnpm deploy:dev`.

## Known debt (deliberate, not oversights)

- `retention_records` table and `retention.ts` repository keep names that describe one point type
  while holding all of them. Rename is a mechanical but wide diff; deferred until something else
  forces a touch of those files.
- Point totals are computed per request with no caching. Correct and fast enough at club scale;
  revisit if a term exceeds a few thousand records.
- `absent` only covers members who RSVP'd yes. There is no notion of "expected to attend" beyond
  RSVP, so a mandatory-attendance report is not possible yet.

## Phasing

The spec is one unit because late tracking feeds §3, §4, and §5. Implementation phases:

1. `0014` + constants + `attendance-status.ts` + tests
2. Retention de-specialization (repo, permanence guard, point-types UI, member page retitle)
3. `attendance-reports.ts` + tests
4. Admin routes: Overview, Events, Event roster
5. Admin routes: Members, Scan log, Ledger + nav registration
6. `/portal/admin/members/[id]`
7. Scanner panel: placement, multi-event, undo + tests

Phases 1-2 are independently shippable. Phases 4-6 depend on 3. Phase 7 is independent of all others.
