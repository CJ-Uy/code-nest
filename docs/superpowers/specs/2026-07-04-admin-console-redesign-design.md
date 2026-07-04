# Admin Console Redesign — Design Spec

**Date:** 2026-07-04
**Status:** Approved for planning
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
- No redirects/aliases for the old flat admin URLs. They are internal admin routes; they move.
- No changes to how `member_roles` drives `actor.roles` — the actor is already rebuilt per request.

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
| **Growth & Data** (`growth`) | Log Retention | `/portal/admin/growth/retention` | Retention · `/retention` | Record retention/attendance records |
| | Data Exports | `/portal/admin/growth/exports` | Reporting · `/reporting` | CSV exports of retention data |
| | Short Links | `/portal/admin/growth/links` | Links · `/links` | Moderate member short links |
| **System** (`system`) | Pinned Nav Links | `/portal/admin/system/nav-pins` | Nav pins · `/nav-pins` | Links shown in every member's top nav |
| | Dashboard Shortcuts | `/portal/admin/system/quick-links` | Quick links · `/quick-links` | Resources in the dashboard Quick Links widget |
| | Activity Log | `/portal/admin/system/audit` | Audit log · `/audit` | Recorded admin actions |

Detail routes move with their parent (e.g. `surveys/[id]` → `content/surveys/[id]`).

Permission gating per page is unchanged — each page keeps its existing `can(actor, ...)` check.
Group nav items and dashboard tiles are filtered by the same checks so a group with no visible
pages does not render.

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
- **Member search:** new `members.search(actor, query)` repository method — `member:manage`-gated,
  case-insensitive `LIKE` over `name`, `full_name`, `nickname`, and `email`, capped (e.g. 20 rows).
- **Read a member's roles:** join `member_roles` → `roles.key` for the selected member.
- **Write:** `assignRoleAction` / `revokeRoleAction` server actions (`role:assign`-gated) that
  insert/delete `member_roles` rows, stamp `assigned_by = actor.memberId`, and write an audit entry
  (`role:assign` / `role:revoke`). Diff-based save (compare desired set vs current set) is acceptable.

### UI

```
Roles & Access
[intro card: who should use this, what a role unlocks, changes take effect next sign-in-ish]

Search member:  [ jdela________ ]
  → Juan Dela Cruz   juan@code.org
  → Juana Dela Rosa  juana@code.org

Roles for Juan Dela Cruz
  [✓] Overall Admin   — full access to everything (only Overall Admins can grant this)
  [ ] Member Admin    — manage members, roles, nav pins, dashboard shortcuts
  [✓] Publishing      — announcements, library, article moderation
  [ ] Retention       — record retention, approve events, assign points
  [ ] Links           — moderate short links
  [ ] Calendar        — (as defined by its permissions)
                                  [ Save changes ]
```

### Guardrails (all three, confirmed)

1. **Only Overall Admins grant Overall Admin.** The `super` toggle is disabled (with an explanatory
   tooltip) unless `actor.roles.includes("super")`. Enforced again server-side in `assignRoleAction`:
   a non-super attempting to add/remove `super` is rejected.
2. **Block removing the last Overall Admin.** `revokeRoleAction` counts remaining `super` holders
   before removing `super`; if this is the last one, reject with a clear message. Enforced
   server-side (source of truth), surfaced client-side as a disabled state where known.
3. **Confirm self-changes.** If the target member is the current actor and the save removes any of
   the actor's own roles, show a confirmation dialog ("This removes your own access — continue?")
   before submitting.

Server-side checks are authoritative; client-side disabling is UX sugar.

## 3. Member List + bulk add (`members/list`)

Keep the term picker and table; rename, add intro card, add bulk add.

- **Intro card:** what the list is (official members this term), that adding an email lets that
  person sign in, and that members link automatically on first login.
- **Bulk add:** a textarea labeled "Paste a column of emails (e.g. from Google Sheets)". On
  input/paste it parses client-side: split on newlines/commas/semicolons/whitespace, trim,
  lowercase, dedupe, validate each with the same email rule as the single-add form. Live summary:
  **"N valid · M already members · K invalid"**, with the invalid entries listed so they can be
  fixed. A `bulkAddRosterAction` accepts the raw text + `termId`, re-validates server-side (never
  trust the client parse), inserts the valid+new emails, and returns/reports counts. Existing
  single-add form stays for one-offs.

Parsing note: the client parse is for preview only; the server action re-parses and re-validates
so a hand-edited request cannot inject bad rows.

## 4. Onboarding pattern

- New `<AdminIntro title, whoFor, effect>` component (in `src/components/portal/`) rendered at the
  top of every admin page and each group index: a short "What this is · Who should use it · What
  happens when you act" callout. Content is per-page copy passed as props (no config indirection).
- Inline helper text under inputs (e.g. the email field, the bulk textarea).
- Meaningful empty states where lists can be empty (already partially present; standardize).
- Console dashboard tiles show a one-line description each (data already exists in the module list).

## 5. Shared-dev / internal-proxy consideration (build-time)

Repositories route through an internal proxy in the shared-dev Worker. `roster.listForTerm` and
`quickLinks.list` already `.catch(() => [])` because "no shared-dev internal proxy yet." The new
`members.search` and role read/write must either (a) work directly against D1 in the normal path
and degrade gracefully in shared-dev like the others, or (b) add internal-contract operations.
Per project rules, **any internal-contract/permissions/dev-seed change requires updating the dev
Worker path** (`pnpm db:migrate:dev` then `pnpm deploy:dev`) — shown as an explicit command and
run only with approval. No schema migration is expected (roles/member_roles already exist); confirm
during planning whether the roles table is seeded in shared dev.

## Testing strategy

- **Unit:** email bulk-parser (valid/invalid/dup/whitespace/comma/CRLF cases); role-diff logic;
  breadcrumb segment walker for each admin route depth.
- **Permission/guardrail:** non-super cannot add/remove `super`; last-super removal blocked;
  `role:assign` required for mutations; `member:manage` required for search — mirror the existing
  `permissions.test.ts` and repository integration-test style.
- **Integration:** `members.search` matches name/full_name/nickname/email case-insensitively;
  `assign`/`revoke` write `member_roles` + audit rows.

## Open questions

- None blocking. Confirm during planning: (a) roles table seeded in shared dev, (b) whether any old
  admin URL is bookmarked externally (default assumption: no, routes move without redirects).
