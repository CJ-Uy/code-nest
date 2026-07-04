# Events & Attendance System — Design Spec

**Date:** 2026-07-04
**Status:** Draft for adversarial review (Codex) then planning
**Branch:** beta
**Related:** `2026-07-04-admin-console-redesign-design.md` (defines the Events org role placeholder)

## Problem

The events system is largely built but wired **admin-only**: only admins (`event:approve`) can
create events, only retention admins (`points:assign`) can scan attendance, and scanning
**materializes retention points immediately** at the event's current value. We want to flip this to
a **member-owned** model — like short links, any member creates an event that appears on the
calendar instantly — with **per-event roles** (owner, event admins, scanners), while keeping
retention-point integrity in the hands of org "CRS admins."

## What already exists (reuse, don't rebuild)

- `crsEvents` (title, type, status, points, place, capacity, `startsAt`, `endsAt`, `description`,
  `createdBy`, `checkinSecret`).
- `eventRsvps` (going/none), `crsAttendance` (`scannedAt`, `scannedBy`), `eventMedia`,
  `eventForumPosts` (threaded, anonymous-capable — this **is** the "event board").
- Events contract ops: `listApproved`, `create`, `approve`, `rsvp`, `scan`, `searchMembers`,
  `listAttendance`, `post`, `listForumPosts`, `revealAuthor`, `addMedia`, `listMedia`.
- `recordScan` writes `crsAttendance` **and** a `retentionRecords` row (`source=event_attendance`)
  snapshotting `event.points`, then notifies the member.

## Decisions (locked with product owner)

1. **Any member creates events; instant publish, no approval.** Owner = `createdBy`. The
   `pending/approved/rejected` workflow is retired for member events. CRS admins moderate reactively
   by **deleting**.
2. **All events require a start AND end time.** `crsEvents.endsAt` becomes required.
3. **Per-event roles** via a new `event_staff` table.
4. **Attendance ≠ points.** Event staff freely mark presence; **only Events-role CRS admins set the
   point value**, anytime (before/during/after), and it re-values retroactively.
5. **Check-in window:** fixed **30 minutes before `startsAt`** until `endsAt`. Plain scanners are
   bound to it; owner/event admins/CRS admins may override (mark present outside the window).
6. **Invites = notify specific members** (not private events). Event stays publicly visible.
7. **CRS admin = the Events org role** (`event:moderate` + `event:points`). Retention role keeps
   retention-data duties only.

## Non-goals

- No private/invite-only events (visibility scoping is out).
- No per-event configurable lead time (30 min is fixed).
- No change to RSVP semantics (going/none stays).
- No rewrite of retention read paths (leaderboard/exports keep `SUM(points)` — see §4).

## 1. Event roles & capability matrix

New table:

```
event_staff
  eventId    text  FK crs_events(id) on delete cascade
  memberId   text  FK members(id)   on delete cascade
  role       text  'admin' | 'scanner'
  addedBy    text  FK members(id)   on delete set null
  addedAt    int   ms, default now
  PK (eventId, memberId)   -- one row per member per event; role is the highest granted
  index (memberId)
```

Owner is `crsEvents.createdBy` (not a staff row). Capability resolution for a member on an event:
`owner` if `createdBy == me`, else look up `event_staff.role`, else org role (`event:moderate`).

| Capability | Owner | Event Admin | Scanner | CRS Admin (Events role) |
|---|:--:|:--:|:--:|:--:|
| Scan → mark present | ✅ | ✅ | ✅ | ✅ |
| Edit title/desc/place/time/capacity | ✅ | ✅ | — | ✅ |
| Manage event board & media | ✅ | ✅ | — | ✅ |
| Add/remove scanners | ✅ | ✅ | — | ✅ |
| Add/remove event admins | ✅ | ✅ | — | ✅ |
| Invite members | ✅ | ✅ | — | ✅ |
| Transfer ownership | ✅ | — | — | — |
| Delete the event | ✅ (own) | — | — | ✅ (any) |
| Override check-in window | ✅ | ✅ | — | ✅ |
| **Set/change point value** | — | — | — | ✅ only |
| Moderate/delete **any** event | — | — | — | ✅ |

Notes (confirmed choices): event admins **can** appoint other admins; owners **can** transfer
ownership; event admins **cannot** delete the event. Transfer sets a new `createdBy` and demotes the
old owner to `admin` (audited).

## 2. Creation, visibility, moderation

- `create` op: `auth: member`, `sharedDev: deny` (writes). Requires `startsAt` **and** `endsAt`
  (`endsAt` no longer nullable in input). Event is visible immediately.
- `listApproved` → **`listPublished`**: returns all non-deleted events (no status filter). Keep the
  op name stable if cheaper, but drop the approved-only filter.
- Delete: new `delete` op — allowed for the owner or `event:moderate`. Hard delete cascades
  attendance/board/media/staff/invites (all FKs already `on delete cascade`).
- `approve`/`reject` ops and the `status` column: **retired.** Leave the column in place (default
  treated as published) to avoid a destructive migration; stop reading it for visibility. A later
  cleanup migration can drop it.

## 3. Check-in window & scanning

- Window = `[startsAt - 30min, endsAt]` (30 min is a fixed constant, e.g. `CHECKIN_LEAD_MS`).
- `recordScan` permission changes from global `points:assign` to **event-staff on this event**
  (owner/admin/scanner) or `event:moderate`.
- Window enforcement in `recordScan` (server-authoritative): reject if `now` is outside the window
  **unless** the actor is owner/event-admin/CRS admin (override). Plain scanners get a clear
  "check-in is closed" error.
- `scan` / `searchMembers` / `listAttendance` ops: re-permission from `points:assign` to the same
  event-staff check. Keep `searchMembers` scoped to the event (it already flags `alreadyScanned`).

## 4. Points as a retroactive CRS lever (the critical reconciliation)

**Chosen approach — keep materialized rows, re-value on change.** (Considered and rejected:
deriving points at read time, which would rewrite every `SUM(points)` path — leaderboard,
`listForMember`, `listForTerm`, `listMemberTermHistory`, `myHistory`, exports — and is far riskier.)

- **Scanning** writes `crsAttendance` (presence, always) **and** an `event_attendance`
  `retentionRecords` row valued at the event's **current** `points` (may be `null`/0). The scan-time
  "you earned N points" notification is **removed** from `recordScan`.
- **Setting/changing points** is a new `setPoints` op (`event:points` only). It updates
  `crsEvents.points` and re-values in one statement:
  `UPDATE retention_records SET points = ? WHERE event_id = ? AND source = 'event_attendance'`,
  then batch-notifies attendees ("This event is now worth N points"). This makes point changes
  retroactive with O(1) SQL and **zero changes to the read paths**.
- **Requires** `retentionRecords` to carry `event_id` so the re-value UPDATE can target it.
  **Verify during planning** whether the column exists; if not, add it (migration + backfill from
  existing `event_attendance` rows via their linkage). This is the single biggest planning risk.

## 5. Invites

- New table `event_invites (eventId, memberId, invitedBy, invitedAt, PK(eventId,memberId))`.
- `invite` op (owner/admin): inserts rows for selected members and creates a `notifications` entry
  each ("You're invited to <title>"). `listInvites` op returns invitees for the event UI.
- Member UI: an "Invited" surface (bell notification + optionally an Invited filter on the calendar).
  Event remains publicly visible; RSVP (going/none) unchanged and independent of invite.

## 6. Permissions & roles

- Add permissions `event:moderate` and `event:points` to `permissionActions`.
- Rename role key `calendar` → `events`; set `rolePermissions.events = ["event:moderate",
  "event:points"]`. Update seed (`roles` table row + `seedRoles`/`seedMemberRoles`) and
  `permissions.test.ts`.
- `super` continues to imply everything.
- Retention role keeps `retention:record`, `points:assign` (still used by **manual** retention
  records), and `event:approve` becomes dead (approval retired) — remove it from the retention set
  or leave harmlessly; planning decides.
- Member-level actions (create/scan-as-staff/board/invite) are gated by **event-staff membership**,
  not org permissions, so they need no new `permissionActions` entries.

## 7. Contract / API changes (events contract)

| Op | Change |
|---|---|
| `create` | auth `admin`→`member`; `endsAt` required; drop approval; sharedDev stays `deny` |
| `listApproved` | drop approved-only filter (all published) |
| `update` ✨ | new; edit event fields; event-staff (owner/admin) or `event:moderate` |
| `delete` ✨ | new; owner or `event:moderate` |
| `setPoints` ✨ | new; `event:points` only; re-values + notifies |
| `addStaff` / `removeStaff` ✨ | new; add/remove admin or scanner per matrix |
| `transferOwnership` ✨ | new; owner only |
| `invite` / `listInvites` ✨ | new; owner/admin |
| `scan`, `searchMembers`, `listAttendance` | re-permission to event-staff; `scan` adds window check |
| `approve` / `reject` | retire |
| `post`, `listForumPosts`, `addMedia`, `listMedia`, `rsvp`, `revealAuthor` | unchanged (board/media already member-writable; confirm edit rights on board align with staff) |

Internal-contract changes ⇒ **update the shared-dev Worker path** (`pnpm db:migrate:dev` then
`pnpm deploy:dev`) per project rules — shown as explicit commands, run only on approval.

## 8. Schema migrations (all gated behind explicit approval + `wrangler` command)

1. `crs_events.ends_at` → `NOT NULL` (backfill existing nulls first, e.g. `starts_at + 3h`).
2. New `event_staff` table.
3. New `event_invites` table.
4. `retention_records.event_id` — add if missing (§4), backfill, index.
5. (Deferred) drop `crs_events.status` once nothing reads it.

No production or dev DB is touched without showing the exact `pnpm exec wrangler` command and
waiting for approval.

## 9. Testing strategy

- **Window:** scan allowed inside `[start-30m, end]`; rejected outside for scanners; allowed outside
  for owner/admin/CRS override.
- **Roles:** owner-only transfer/delete; admin can add admins+scanners but not delete; scanner can
  only scan; non-staff rejected on edit/scan.
- **Points re-value:** set points → all prior `event_attendance` records for that event update;
  leaderboard/exports `SUM` reflects new value; late scan after set inherits current value.
- **Points authority:** only `event:points` can set; scanners/owner cannot.
- **Invites:** invite writes rows + notifications; does not change visibility or RSVP.
- **Instant publish:** created event appears in `listPublished` immediately; delete removes it.
- Mirror existing `events.test.ts` / integration-test style; keep parity in shared-dev adapter.

## 10. Open questions (resolve in review/planning)

- Does `retention_records` already have `event_id`? (Blocks §4 re-value UPDATE if not.)
- Should the "Invited" filter live on the calendar, or is a bell notification enough for v1?
- Keep `event.type` (official/casual/birthday) as a member-set field, or CRS-only? Default: member
  sets a type on create; it's cosmetic and does not affect points (points are the CRS lever).
- Backfill value for existing null `ends_at` rows before the NOT NULL migration.
