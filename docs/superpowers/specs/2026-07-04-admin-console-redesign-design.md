# Admin Console Redesign — Design Spec

**Date:** 2026-07-04
**Status:** Revised after adversarial review (Codex + ChatGPT) — ready for planning
**Branch:** beta

## Problem

The `/portal/admin` console is one flat 12-tab bar plus an 8-card grid. Everything sits at the
same level, several pages use internal jargon ("Roster", "Reporting" vs "Retention"), and there
is no in-page explanation, so a first-time admin cannot tell what a page does or who it is for.
Two gaps compound the confusion:

1. **No bulk member add.** The Member List (roster) accepts one email at a time; officers onboard
   a whole batch from a Google Sheet column.
2. **No role-assignment UI at all.** The permission model (`role:assign`, the `roles` and
   `member_roles` tables, roles `super` / `member_admin` / `publishing` / `retention` / `link` /
   `calendar` / `member`) is fully built in the data layer but **nothing in the app assigns roles**.
   There is no page to make someone an admin.

## Goals

- Group admin pages into 4 nested sections with a real breadcrumb, so the console is navigable.
- Rename internal jargon to plain language.
- Add a **Roles & Access** page (member-first) to grant/revoke admin roles safely.
- Add **bulk add** (paste a column of emails) to the Member List.
- Add consistent in-context explanation (intro card + inline hints + empty states) to every page.

## Non-goals

- No new roles or changes to the permission model — only surfacing roles that already exist.
- No coach-mark tour and no separate guide page (intro cards were chosen instead).
- Old→new URL redirects are optional, not required (internal auth-gated routes; see §1).
- No change to how roles reach `actor.roles`: the Auth.js **database-session** `session()` callback
  already re-queries `member_roles` from D1 on every request (`src/auth.ts`), so role changes take
  effect immediately — no JWT staleness, no forced re-login.

## 1. Information architecture

### Groups, routes, and rename map

Pages move to `/portal/admin/<group>/<page>`. Each group folder owns a `layout.tsx` that renders
the group's sub-nav; the console root renders the grouped dashboard.

| Group (route seg) | New page name | Route | Old name / route | What it does |
|---|---|---|---|---|
| **Members & Access** (`members`) | Member List | `/portal/admin/members/list` | Roster · `/roster` | Official CODE members for a term; an email lets that person sign in |
| | Roles & Access ✨NEW | `/portal/admin/members/roles` | — | Grant admin roles to members |
| **Content** (`content`) | Announcements | `/portal/admin/content/announcements` | `/announcements` | Org posts |
| | Library | `/portal/admin/content/library` | `/library` | Articles & case studies |
| | Surveys | `/portal/admin/content/surveys` | `/surveys` | Sampling & questions |
| | Public Submissions | `/portal/admin/content/submissions` | Submissions · `/submissions` | Contact inquiries + article feedback from the public site |
| | Short Links | `/portal/admin/content/links` | Links · `/links` | Moderate member short links (member-generated content) |
| **Data** (`data`) | Log Retention | `/portal/admin/data/retention` | Retention · `/retention` | Record retention/attendance records |
| | Data Exports | `/portal/admin/data/exports` | Reporting · `/reporting` | CSV exports of retention data |
| **System** (`system`) | Pinned Nav Links | `/portal/admin/system/nav-pins` | Nav pins · `/nav-pins` | Links shown in every member's top nav |
| | Dashboard Shortcuts | `/portal/admin/system/quick-links` | Quick links · `/quick-links` | Resources in the dashboard Quick Links widget |
| | Activity Log | `/portal/admin/system/audit` | Audit log · `/audit` | Recorded admin actions |

Detail routes move with their parent (e.g. `surveys/[id]` → `content/surveys/[id]`).

### Route migration inventory (every mover + every reference)

Moving the routes is not just renaming folders — several files hardcode the old paths and MUST be
updated in the same change, or links/revalidation silently break:

- **Pages/layouts to move:** `roster`, `surveys` (+ `surveys/[id]`), `announcements`, `library`,
  `submissions`, `links`, `retention` (+ its `member-checklist`/`retention-form` components),
  `reporting`, `nav-pins`, `quick-links`, `audit`, plus the dashboard `page.tsx` and `layout.tsx`.
- **`revalidatePath("/portal/admin/<old>")` calls** in every action file: `roster/actions.ts`,
  `announcements/actions.ts`, `surveys/actions.ts`, `retention/actions.ts`, `quick-links/actions.ts`,
  `nav-pins/actions.ts`, `library/actions.ts` — retarget to the new nested paths.
- **Nav/hrefs/redirects:** `admin/layout.tsx` (tab list), `admin/page.tsx` (module tiles),
  `portal-shell.tsx`, and any `<Link>`/`redirect()` to old admin paths.
- **Tests:** `e2e/retention-record.spec.ts` and any spec asserting old paths/labels.

Planning MUST start from a fresh grep of `/portal/admin/` across `src/` + `e2e/`; the list above is a
floor, not a ceiling.

**Authorization stays on the pages, not just the nav.** Each moved page keeps its own
`can(actor, ...)` guard (direct-URL access must fail without it); nav/tile filtering is cosmetic and
reads the SAME per-route permission from `nav.ts` (below) so the two can't drift. A group index with
no visible children returns not-found/redirect rather than an empty shell.

**Old→new redirects (optional).** Internal, auth-gated routes with no known external bookmarks. If
cheap, add a small old→new redirect map (Next `redirects()` or a catch route) as a safety net;
otherwise omit.

### Breadcrumb mechanics

`getPageHeading` in `src/components/portal/portal-shell.tsx` currently hardcodes
`split("/")[3]` — one level deep. Replace it with a segment walker that maps
`/portal/admin/<group>/<page>` to a breadcrumb trail using a single source-of-truth map of
`{ segment, label, href }`. The trail renders `Admin › <Group> › <Page>` with each ancestor
clickable. The map lives in `src/app/portal/admin/nav.ts` (new) so the layout, group layouts,
dashboard, and breadcrumb all read the same structure.

- `Admin` → `/portal/admin`
- `<Group>` → `/portal/admin/<group>` (group index; see below)
- `<Page>` → current page (not a link)

A `<Breadcrumb>` presentational component (new, in `src/components/portal/`) renders the trail;
it is generic (takes an array of `{ label, href? }`).

### Group index pages

Each `/portal/admin/<group>` renders a small landing: the group's intro card + the group's page
tiles. The console root `/portal/admin` renders all 4 groups as labeled sections of tiles
(replacing the current flat 8-card grid), each tile showing name + one-line description.

## 2. Roles & Access page (`members/roles`)

Member-first flow, gated by `can(actor, "role:assign")`.

### Data

- **Read available roles** from the `roles` table (already seeded with `key`/`label`/`description`).
  Display only assignable roles (exclude `member`, which is the implicit baseline). Each role's
  plain description comes from the `roles.description` column; if a friendlier copy is wanted it is
  edited in the seed, not hardcoded in the page.
- **Member search:** new `members.search(actor, query)` repository method — case-insensitive `LIKE`
  over `name`, `full_name`, `nickname`, `email`, with **min query length 2** and **capped at 20
  rows**. At org scale (hundreds–low thousands of members) a capped `LIKE` scan is fine; add a
  normalized search index only if measured slow. **Permission:** the page needs both `role:assign`
  (mutate) and `member:manage` (search); today the only `role:assign` holders are `member_admin`
  (which also has `member:manage`) and `super`, so they align — gate the page on `role:assign` and
  let search run for those actors. Flag if a `role:assign`-only role is ever added.
- **Read a member's roles:** join `member_roles` → `roles.key`; gated the same as the page.
- **Assignable targets:** only existing `members` rows (the `member_roles.member_id` FK guarantees
  it). Roles are org-wide, not term-scoped; assigning to a non-active member is allowed (pre-grant),
  nothing restricts by roster/term.
- **Write (atomic, server-computed diff):** `assignRoleAction` / `revokeRoleAction`, `role:assign`-
  gated. The server **loads the member's current roles fresh from D1**, computes the add/remove diff
  itself, and ignores any client-supplied "current" state (the client sends only the desired set).
  Each mutation writes the `member_roles` change **and** its audit row (`role:assign` / `role:revoke`,
  `assigned_by = actor.memberId`) in a single **`db.batch([...])`** — D1 has no interactive
  transactions, so `batch()` is the atomic unit — so a change and its audit entry can't diverge.

### UI

```
Roles & Access
[intro card: who should use this, what a role unlocks, changes take effect immediately (next request)]

Search member:  [ jdela________ ]
  → Juan Dela Cruz   juan@code.org
  → Juana Dela Rosa  juana@code.org

Roles for Juan Dela Cruz
  [✓] Overall Admin   — full access to everything (only Overall Admins can grant this)
  [ ] Member Admin    — manage members, roles, nav pins, dashboard shortcuts
  [✓] Publishing      — announcements, library, article moderation
  [ ] Retention       — record retention, approve events, assign points
  [ ] Links           — moderate short links
  [ ] Events          — INACTIVE placeholder, grants nothing until the events system ships
                                  [ Save changes ]
```

### Guardrails (all three, confirmed)

1. **Only Overall Admins grant Overall Admin.** The `super` toggle is disabled (with a tooltip)
   unless `actor.roles.includes("super")`. Enforced again server-side in `assignRoleAction`: a
   non-super adding/removing `super` is rejected. This check is **independent of the generic
   `role:assign` gate** — holding `role:assign` never implies the right to touch `super`.
2. **Block removing the last Overall Admin — race-safe.** D1 has no interactive transactions, so a
   read-count-then-delete is a TOCTOU hole (two admins each remove a different super, both counts
   pass, zero remain). Instead remove `super` with a **guarded conditional delete** — delete only if
   more than one `super` assignment exists, e.g. `DELETE FROM member_roles WHERE member_id=? AND
   role_id=:super AND (SELECT count(*) FROM member_roles WHERE role_id=:super) > 1` — then check
   affected-rows; 0 ⇒ reject "at least one Overall Admin required." One statement, no race; covered
   by a concurrency test.
3. **Confirm self-changes.** If the target is the current actor and the save removes any of the
   actor's own roles, show a confirmation ("This removes your own access — continue?") before
   submitting. Revocation is immediate (see Non-goals), so self-demotion takes effect next request.

Server-side checks are authoritative; client-side disabling is UX sugar.

## 3. Member List + bulk add (`members/list`)

Keep the term picker and table; rename, add intro card, add bulk add.

- **Intro card:** what the list is (official members this term), that adding an email lets that
  person sign in, and that members link automatically on first login.
- **Shared parser.** Single-add and bulk-add use ONE canonical normalizer/validator (the existing
  roster `addSchema`: `trim().toLowerCase().email()`), so both paths behave identically. The client
  parse (split on newlines/commas/semicolons/whitespace, dedupe) is **preview only**; the server
  action re-parses and re-validates the raw text so a hand-edited request can't inject bad rows.
- **Bulk add UI:** a textarea labeled "Paste a column of emails (e.g. from Google Sheets)". Live
  summary **"N valid · M already members · K invalid"**, invalid entries listed for fixing. The
  single-add form stays for one-offs.
- **Limits (D1 budget).** Cap at **≤ 500 emails per submission** plus a max payload size; reject over
  the cap with guidance to split. Insert in **chunked `db.batch([...])`** writes within D1's
  ~100-bound-param / 100 KB-per-statement budget (mirrors the manual-retention batch pattern).
- **Idempotent, partial success.** Insert with `onConflictDoNothing` against the `term_member_roster`
  PK `(termId, email)`, so members already on the roster are skipped, not errored.
  `bulkAddRosterAction(termId, rawText)` returns `{ added, skippedDuplicates, invalid: string[] }`;
  the UI renders those counts + the invalid list. Valid rows commit even when some rows are invalid
  (invalid ones are reported, never block the batch).
- **Write safety in shared-dev:** see §5 — bulk add fails loudly if the write path is unavailable,
  never silently reports success.

## 4. Onboarding pattern

- New `<AdminIntro title, whoFor, effect>` component (in `src/components/portal/`) rendered at the
  top of every admin page and each group index: a short "What this is · Who should use it · What
  happens when you act" callout. Keep it **compact** (2–3 lines) so it never pushes primary controls
  below the fold on dense pages; a collapse toggle is optional. Per-route identity/label/short
  description come from the single `nav.ts` map (§1) so tiles, breadcrumb, and nav can't drift; only
  the longer intro **body** copy is a local prop.
- Inline helper text under inputs (e.g. the email field, the bulk textarea).
- Meaningful empty states where lists can be empty (already partially present; standardize).
- Console dashboard tiles show a one-line description each (data already exists in the module list).

## 5. Shared-dev / internal-proxy consideration (build-time)

Repositories route through an internal proxy in the shared-dev Worker. `roster.listForTerm` and
`quickLinks.list` already `.catch(() => [])` because "no shared-dev internal proxy yet." The new
`members.search` and role read/write must either (a) work directly against D1 in the normal path
and degrade gracefully in shared-dev like the others, or (b) add internal-contract operations.
**Reads may degrade to `[]`; writes must not.** Role assign/revoke and bulk add **fail loudly** in
shared-dev if their write path is unavailable — never silently no-op or fake success.
Per project rules, **any internal-contract/permissions/dev-seed change requires updating the dev
Worker path** (`pnpm db:migrate:dev` then `pnpm deploy:dev`) — shown as an explicit command and
run only with approval. No schema migration is expected (roles/member_roles already exist); confirm
during planning whether the roles table is seeded in shared dev.

## Testing strategy

- **Unit:** shared email parser/normalizer (valid/invalid/dup/whitespace/comma/CRLF, over-cap);
  server-side role-diff (recomputed from DB, ignores client "current"); breadcrumb segment walker
  incl. dynamic segments (`surveys/[id]`).
- **Permission/guardrail:** non-super cannot add/remove `super` (independent of `role:assign`);
  `role:assign` required for mutations; direct-URL access to a moved page fails without its `can()`
  guard — mirror `permissions.test.ts`.
- **Concurrency:** two simultaneous last-super removals ⇒ exactly one succeeds and one `super`
  remains (guarded-delete race test).
- **Integration:** `members.search` matches name/full_name/nickname/email case-insensitively with
  min-length + cap; `assign`/`revoke` write `member_roles` + audit atomically (`db.batch`); bulk add
  is idempotent and returns `{ added, skippedDuplicates, invalid }`.
- **Migration:** a grep/test check that no `/portal/admin/<old>` reference remains in `src/` or
  `e2e/` after the move.

## Open questions

- Confirm during planning: roles table seeded in shared dev; exact chunk size for bulk `db.batch`
  under the D1 param budget.
- The `calendar` role shows as **Events (inactive)** — grants nothing today, so assigning it is
  harmless. Renaming `calendar` → `events` and giving it real powers is the events-system spec's job;
  until then it stays labeled inactive to avoid a "granted a role that silently gains power" footgun.

## Adversarial-review disposition (2026-07-04)

Reviewed 31 findings (Codex run cancelled; ChatGPT pass folded in **after repo verification** —
several findings were guesses made without codebase access). **Accepted & folded above:** atomic
server-computed role diff via `db.batch` (#2,13,23), race-safe last-super guarded delete (#1),
super-check independent of `role:assign` (#3), full route/link migration inventory + page-level
guards (#6,7,9,20,21,30), dynamic-segment breadcrumb (#8), bulk-add limits/idempotency/result-shape/
shared parser (#10,11,12,27,28), shared-dev write-fail-loud (#15), search min-length+cap + permission
coupling note (#17,18,24), group-index not-found (#19), compact intro cards (#29), Events-inactive
label (#16), status reclassified (#31), target eligibility (#4).

**Rejected after verifying against the repo:**
- **#5 (role-change timing):** not a lag — `src/auth.ts` uses `session.strategy="database"` and the
  `session()` callback re-reads `member_roles` from D1 every request, so revocation is immediate.
  Only the spec's "next sign-in" copy was wrong (fixed).
- **#14 (`assigned_by` nullable):** `Actor.memberId` is a required `string`; always valid.
- **#25 (rate-limit role/search/bulk):** YAGNI for a small trusted admin set behind auth; the audit
  log is the accountability control. Revisit only on evidence of abuse.
- **#26 (CSRF/server-action):** Next server actions are same-origin POST and the app already runs an
  `assertSameOrigin` check with same-site Auth.js cookies; no new work.
