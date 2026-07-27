# Event Taxonomy & Multi-Type Points — Design Spec

**Date:** 2026-07-27
**Status:** Approved by product owner. Ready for planning (two plans — see §9).
**Branch:** beta
**Related:** `2026-07-25-events-attendance-finalization-design.md` (deferred this work as "spec 3"),
`2026-07-04-events-attendance-system-design.md` (the member-owned model)

## Problem

Two limitations remain from the finalization spec, both deferred there by explicit product decision.

1. **Event types are a fixed enum.** `casual | official | birthday` is hardcoded in ten places. An
   admin can configure *which permission* each type requires, but cannot add "Workshop" or
   "General Assembly". The org needs its own labels.
2. **Points are single-valued.** An event is worth one number, and `retention_records.points` is one
   undifferentiated column. The org needs several categories — Retention, Frontliner, Project Lead,
   and more later — with one event able to award several at once ("2 Retention and 3 Frontliner"),
   so they can drive qualification rules later.

## The load-bearing risk

**Six** places aggregate `retention_records.points` with no notion of type:

| Site | What it feeds |
| --- | --- |
| `src/db/repositories/retention.ts:168` | `getMemberTermSummary` → **retained / probation status** |
| `src/db/repositories/retention.ts:200` | admin leaderboard |
| `src/db/repositories/retention.ts:219` | public leaderboard |
| `src/db/repositories/retention.ts:356` | `myHistory` — an **in-memory `reduce`**, not SQL |
| `src/db/repositories/overview.ts:51` | dashboard total |
| `src/db/repositories/retention.ts:114` | `reportBaseColumns` → CSV/XLSX exports |

The moment a second point type writes a row, every one of these starts adding Frontliner points into
what is meant to be the Retention total — inflating leaderboards and **flipping members between
retained and probation**. Note the fourth: it is a JavaScript `reduce`, so a SQL-only fix silently
misses it.

Getting all six right is the single most important correctness requirement in this spec.

## What already exists (reuse, don't rebuild)

- `event_type_rules` (from migration `0010`) is already a type→permission map keyed by type. It
  **becomes** the new `event_types` table by gaining columns — it is not replaced by a parallel one.
- `crs_events.type` already stores exactly the strings `casual` / `official` / `birthday`, so it can
  gain a foreign key to `event_types.key` with **no row migration**.
- `canCreateType` / `allowedEventTypes` / `createEventTypeRulesRepository`
  (`src/db/repositories/eventTypeRules.ts`) already implement permission gating, including the
  fail-closed behaviour for unrecognized permissions. Extend; do not rewrite.
- The admin screen at `/portal/admin/system/event-types` already exists with its server action,
  pure `parseEventTypeRuleInput` parser, and `role:assign` guard.
- `events.create` **and** `events.update` already enforce type gating at the repository layer.
- `undoScan` already deletes retention rows scoped by `(event_id, member_id, source)`, which
  correctly removes *all* per-type rows with no change.
- `src/db/migrate-local-sqlite.ts` documents a known ceiling that §7 cashes in.

## Corrections to assumptions made while designing

Recorded so the plan does not repeat them:

- **`calendar-month.tsx` is NOT affected.** Its `SOURCE_CHIP` / `SOURCE_DOT` maps are keyed by
  `CalendarItem["source"]` (`event` / `birthday` / `term_deadline`), which is calendar provenance,
  not event type. Its `birthday` entry means *member birthdays* and must not be conflated with the
  `birthday` event type.
- **Event types have no colour today.** `events-list.tsx:10` carries the type union but applies no
  styling to it. The colour column is net-new UI, not a migration of existing maps.

## Decisions (locked with product owner)

1. **Event types become admin-managed rows** with label, colour, required permission, active flag,
   and ordering. The `casual | official | birthday` enum is retired.
2. **Point types are admin-managed**, and a boolean `counts_toward_retention` marks which drive the
   term's retained/probation thresholds. Multiple types may carry it; they sum.
3. **Soft-disable, never delete.** Neither event types nor point types may be deleted. An `active`
   flag hides them from creation forms while existing rows keep resolving their label and colour.
4. **Colour comes from a fixed named palette**, not a free hex picker — the codebase styles with
   Tailwind classes, which cannot be generated at runtime, and a palette guarantees light/dark
   legibility.
5. **Points stay per-event.** Event types do **not** carry default point awards. Only `event:points`
   holders set an event's awards, preserving today's guardrail that a member creating an event
   cannot award themselves points.
6. **Members see the full breakdown** — profile widget, event detail, and a type-filterable
   leaderboard defaulting to Retention — alongside the admin views and exports.

## Non-goals

- No qualification *rules* engine. This spec makes the data available; deciding what qualifies
  someone as a Frontliner is a later product decision.
- No per-type retained/probation thresholds. `terms.retained_at` / `probation_below` keep driving a
  single total, computed from the types flagged `counts_toward_retention`.
- No `ends_at NOT NULL` backfill — still deferred.
- No changes to RSVP, event forum, or event media.
- No new npm dependency.
- No bulk historical re-typing tool. Soft-disable means one is never required.

---

## 1. `event_types`

`event_type_rules` gains columns and is renamed:

```sql
event_types
  key                  TEXT PRIMARY KEY  -- 'casual', 'workshop', 'gen_assembly'
  label                TEXT NOT NULL     -- 'General Assembly'
  colour               TEXT NOT NULL     -- palette token, see below
  required_permission  TEXT              -- NULL = any member (carried over unchanged)
  active               INTEGER NOT NULL DEFAULT 1
  position             INTEGER NOT NULL DEFAULT 0
  updated_by           TEXT REFERENCES members(id) ON DELETE SET NULL
  updated_at           INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
```

Seeded from the three existing rows, preserving their current permissions
(`casual`→NULL, `birthday`→NULL, `official`→`event:create_restricted`), with labels
`Casual` / `Birthday` / `Official` and distinct palette tokens.

`crs_events.type` keeps its existing values and is **deliberately left without a foreign key**.
SQLite has no `ALTER TABLE … ADD CONSTRAINT`, so adding one would require a full table rebuild of
`crs_events` — which would drag §7's runner-ceiling change into Plan A and destroy its low-risk
profile for very little gain. Instead:

- `events.create` and `events.update` already validate the type at the repository layer; that
  validation extends to "must be an existing, active type".
- Soft-disable (never delete) means a key can never disappear from under an existing event.
- A type key with no matching row renders as its raw key with the `slate` fallback colour, rather
  than crashing.

The only way to orphan a type is a manual write straight to the database, which is the same class of
risk already accepted for `required_permission`, and is handled the same way — degrade visibly
rather than fail.

Because the column already holds exactly the seeded keys, **no event rows are migrated**.

### Palette

A fixed set of tokens, each mapping to a Tailwind class pair in one place in code:

```
primary · accent · emerald · amber · rose · slate
```

Stored as the token string. A row whose token is unrecognized falls back to `slate` rather than
rendering unstyled — the same fail-safe posture as the permission handling, but falling back to a
*visual* default is safe where falling open on a *permission* would not be.

### Retiring a type

Setting `active = 0` removes it from creation and edit forms. Existing events keep their type and
keep rendering its label and colour. `canCreateType` gains an active check: an inactive type cannot
be chosen for a new event or switched to on an existing one, but an event already on that type may
be edited without changing its type — mirroring the same-type-resubmit rule already implemented in
`events.update`.

## 2. `point_types` and `event_point_awards`

```sql
point_types
  id                       TEXT PRIMARY KEY      -- 'pt_retention'
  key                      TEXT NOT NULL UNIQUE  -- 'retention'
  label                    TEXT NOT NULL         -- 'Retention'
  counts_toward_retention  INTEGER NOT NULL DEFAULT 0
  active                   INTEGER NOT NULL DEFAULT 1
  position                 INTEGER NOT NULL DEFAULT 0
  updated_by               TEXT REFERENCES members(id) ON DELETE SET NULL
  updated_at               INTEGER NOT NULL DEFAULT (unixepoch() * 1000)

event_point_awards
  event_id       TEXT NOT NULL REFERENCES crs_events(id) ON DELETE CASCADE
  point_type_id  TEXT NOT NULL REFERENCES point_types(id)
  points         INTEGER NOT NULL
  PRIMARY KEY (event_id, point_type_id)
```

Seeded: `pt_retention` (Retention, `counts_toward_retention = 1`), `pt_frontliner` (Frontliner, 0),
`pt_project_lead` (Project Lead, 0).

Multiple types may carry `counts_toward_retention`; their points sum. There is deliberately **no
exclusivity constraint** — enforcing "exactly one" adds a rule with no benefit, since summing is
already the correct behaviour for two.

**Guard:** the admin screen must refuse to clear the last `counts_toward_retention` flag. With zero
flagged types every member's retention total silently becomes zero and everyone drops to probation.

## 3. `retention_records.point_type_id`

```sql
retention_records
  + point_type_id  TEXT NOT NULL REFERENCES point_types(id)
```

Every existing row backfills to `pt_retention`.

A **partial unique index** makes event-attendance rows addressable for upsert:

```sql
CREATE UNIQUE INDEX retention_records_event_member_type_idx
  ON retention_records (event_id, member_id, point_type_id)
  WHERE source = 'event_attendance';
```

This is what lets §5 reconcile awards without deleting and recreating rows, preserving each row's
original `recorded_at` and `recorded_by`.

## 4. The six aggregations

Each gains a filter restricting to types flagged `counts_toward_retention`:

```sql
SUM(retention_records.points)
  WHERE retention_records.point_type_id IN
        (SELECT id FROM point_types WHERE counts_toward_retention = 1)
```

Applied to `retention.ts:168`, `:200`, `:219`, and `overview.ts:51`.

`retention.ts:356` is **not** SQL — it is `rows.reduce((sum, row) => sum + (row.points ?? 0), 0)`.
Its `rows` query must gain the same restriction, or the summary must reduce only over matching rows.
Do not fix the five SQL sites and forget this one.

`reportBaseColumns` (`retention.ts:114`) gains a `pointTypeLabel` column, and `xlsx.ts:27`'s `Points`
column is joined by a `Point Type` column, so exports stay unambiguous.

New per-type reads (`GROUP BY point_type_id`) back the breakdown views in §6.

## 5. `setPoints` → `setAwards`

```ts
setAwards(actor, eventId, awards: Array<{ pointTypeId: string; points: number }>): Promise<{ updated: number }>
```

Still gated on `event:points`. Semantics:

1. Replace the event's `event_point_awards` rows with `awards` (atomically).
2. Reconcile every attendee's retention rows against the new awards — upsert on the partial unique
   index for types still awarded, delete rows for types no longer awarded.
3. Notify attendees once, as today.
4. Write one audit entry.

Retroactive re-valuation is preserved: changing an event's awards updates points already granted,
which is the behaviour the 2026-07-04 spec established and members rely on.

`recordScan` writes **one retention row per active award** instead of one row using
`crs_events.points`. An event with no awards records attendance and no points, which is the correct
behaviour for a casual event nobody has valued.

`undoScan` is unchanged — its `(event_id, member_id, source)` scoping already removes every per-type
row.

`crs_events.points` is dropped. Leaving it as a second, denormalized answer to "what is this event
worth" is precisely the kind of drift that produces two disagreeing numbers on screen. Existing
non-null values migrate into `event_point_awards` under `pt_retention`.

## 6. UI

**Admin — `/portal/admin/system/event-types`** (extend the existing screen): label, colour token,
required permission, active toggle, ordering, plus creating new types. Keeps its `role:assign` guard
and its pure-parser + server-action structure.

**Admin — point types** (new sibling screen, same pattern): label, `counts_toward_retention`, active,
ordering. Guarded by `retention:record`, since this is CRS data policy rather than access policy.
Must refuse to clear the last retention flag (§2).

**Event detail:** shows "Worth: 2 Retention · 3 Frontliner". `event:points` holders get an editor with
a row per active point type.

**Create/edit event forms:** the type `<select>` renders active types the actor may create, plus the
event's current type even if inactive or otherwise disallowed — the rule already implemented for
permissions in `events.update` extends to the active flag.

**Events list:** type badge coloured from the type's palette token — net-new styling.

**Profile:** a row per active type. Retention keeps its retained/probation styling; others render as
plain counts.

**Leaderboard:** a type selector defaulting to Retention, so current behaviour is unchanged when
untouched.

## 7. Migration risk — the runner ceiling

Two changes need **SQLite table rebuilds**: adding `retention_records.point_type_id` as `NOT NULL`
with a foreign key (SQLite forbids `ADD COLUMN` carrying both a `REFERENCES` clause and a non-null
default), and dropping `crs_events.points`.

Drizzle generates rebuilds wrapped in `PRAGMA foreign_keys=OFF; … PRAGMA foreign_keys=ON;`.
`src/db/migrate-local-sqlite.ts` executes each migration inside a transaction, where
`PRAGMA foreign_keys` is a **no-op** — a limitation deliberately recorded there as:

> `Ceiling: statements run inside a transaction, so a migration relying on PRAGMA foreign_keys=OFF
> would not take effect. None do today; if one lands, run that file's statements outside the
> transaction.`

This spec is the first to land one. **The runner must be updated before either rebuild migration
is written**: detect a migration whose statements include a `PRAGMA`, and run that file's statements
outside the transaction (accepting that such a file is not atomic, which is inherent to the pattern).
The pure `planMigrations` function is unaffected; only the I/O shell changes.

Verification must cover both database states, as it did for the last runner change: a fresh clone,
and an existing already-migrated local database.

## 8. Testing

Constraints from `vitest.config.mts` are unchanged and binding: Workers pool, `.ts` only, no jsdom,
no React Testing Library, no component render tests, and `better-sqlite3` importable by no test.

Required coverage:

- **The six aggregations.** With one member holding both Retention and Frontliner rows in a term,
  assert `getMemberTermSummary`, both leaderboards, `myHistory`, and the overview total each report
  **only** the retention-flagged points. This is the test that would have caught the whole risk.
- **Threshold integrity.** A member at exactly `retained_at` in Retention who also holds Frontliner
  points must not change status.
- **`setAwards` reconciliation.** Adding, changing, and removing a type's award updates attendees'
  rows correctly, and `recorded_at` survives an unchanged award.
- **Soft-disable.** An inactive type cannot be chosen for a new event, but an event already on it can
  have another field edited.
- **Last retention flag.** Clearing it is refused.
- **Migration runner.** PRAGMA-bearing migrations apply on both a fresh and an existing database.

## 9. Two plans

One spec, two implementation plans — they share this design, the admin surface, and the migration
sequence, but have a hard ordering dependency and very different risk profiles.

**Plan A — event types as data.** `event_types` table (rename + `ADD COLUMN … NOT NULL DEFAULT`
then backfill, so no rebuild), palette, the ten hardcoded `z.enum` / union sites, active-flag
handling, admin screen, type badges. No points involvement, **no table rebuilds** (see §1 on why
`crs_events.type` gets no foreign key), low risk.

**Plan B — multi-type points.** The migration-runner change, both table rebuilds, `point_types`,
`event_point_awards`, `retention_records.point_type_id`, the six aggregations, `setAwards`,
`recordScan`, exports, and the member/admin views. Carries all the migration risk.

Plan A first: it is lower-risk, ships the thing currently blocking the org, and establishes the
admin-screen pattern Plan B's point-types screen follows.

## 10. Deployment

Both plans change schema, so per `CLAUDE.md` the dev Worker path must be updated after each:

```
pnpm db:migrate:dev
pnpm deploy:dev
```

Both require product-owner approval, and wrangler cannot authenticate non-interactively — the
product owner runs them.

**Outstanding from the previous spec:** migration `0010` has not yet been applied to dev D1. That
must land before either plan's migrations, since `event_types` is built by altering the table `0010`
created.
