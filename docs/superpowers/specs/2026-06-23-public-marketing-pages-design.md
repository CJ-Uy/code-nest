# Public marketing pages — design

Date: 2026-06-23 (revised: CMS scope)

## Problem

`design/*.jsx` contains finished static mockups for Landing, Services, Projects,
Product Center (+ article detail), and Contact/SignIn. Only `Home()` (a
stripped-down version of `Landing`) was ever ported into `src/app/`. The other
pages don't exist as routes — visiting `/services`, `/projects`, `/product`, or
`/contact` 404s. Sign-in already exists at `/signin` and is out of scope.

Beyond just shipping the pages, all of their text content should be editable
by content admins without a code deploy — a CMS, not a hardcoded site.

## Goals

- Ship real Next.js routes for Services, Projects, Product Center (+ article
  detail), and Contact, and rework `/` to match the fuller `Landing()` mockup.
- Reuse existing Tailwind tokens and shadcn primitives instead of porting the
  mockups' inline `style={}` objects.
- Move every piece of editable text/content into the database — org
  identity/vision/mission/competencies, services, projects, contact reps, and
  articles — with full create/edit/delete admin UI for the repeatable lists
  and a single edit form for the org-profile singleton.
- Persist Contact form submissions and per-article feedback so officers can
  see them from the admin portal, instead of the mockups' local-only "sent"
  state.

## Out of scope

- Email notifications on new submissions or content changes.
- Porting the mockups' `useReveal()` scroll-fade animation.
- Real photography/map assets — placeholder blocks stand in.
- Versioning/drafts/preview for content edits — edits apply live immediately,
  matching how every other admin tool in this app works (roster, nav pins,
  quick links).

## Routes (public)

| Route | Source mockup | Notes |
|---|---|---|
| `/` (rework) | `Landing()` | Hero w/ stats, intro strip, vision/mission, competencies, OD explainer, article teaser, CTA band — all DB-backed |
| `/services` | `Services()` | Service cards (DB list) + `ProcessBand` + CTA band |
| `/projects` | `Projects()` | Flagship project blocks (DB list) + CTA band |
| `/product` | `ProductCenter()` | Filter/search over DB-backed articles |
| `/product/[slug]` | `Article()` | Article detail + feedback form + "keep reading" |
| `/contact` | `Contact()` | Reps list (DB) + map placeholder + form (persists to DB) |

`/signin` is unchanged.

## Shared layout

Extract the header (logo + nav + "Member sign in") and footer currently
inlined in `src/app/page.tsx` into shared components reused by every public
page. Add nav links: Services, Projects, Product Center, Contact, alongside
the existing "Member sign in" button. `/portal` keeps its own separate layout
— this only affects the public site, per the project rule that `/` stays
reader-first and the member workspace stays under `/portal`.

## Content model

Everything text-ish that a content admin should be able to change lives in
the DB. Layout/structure (the JSX, the order of sections on the page,
styling) stays in code — only the words and repeatable list items are data.

Two shapes:

1. **Singleton** — `orgProfile`: one row holding org identity, vision,
   mission, the "what is OD" blurb, the services-page intro line, and the
   three hero stat pairs and three competency blocks (fixed-size, edited
   inline as part of the same form — not separately addable/removable rows,
   since the page layout always shows exactly 3 of each).
2. **Repeatable lists** — `services`, `projects`, `contactReps`, `articles`:
   each a table with a `position` column for ordering, full CRUD from admin.

## Schema additions (`src/db/schema.ts`)

```ts
orgProfile: {
  id: text primary key,            // fixed "org" — singleton row
  name: text not null,
  fullName: text not null,
  tagline: text not null,
  blurb: text not null,
  vision: text not null,
  mission: text not null,
  whatIsOd: text not null,
  servicesIntro: text not null,
  email: text not null,
  facebookLabel: text not null,
  facebookUrl: text not null,
  room: text not null,
  campus: text not null,
  heroStats: text (mode: "json") not null,    // [{ value, label }] x3
  competencies: text (mode: "json") not null, // [{ title, body }] x3
  updatedAt: integer (timestamp_ms), default nowMs
}

services: {
  id: text primary key,            // createId("svc")
  tag: text not null,
  title: text not null,
  summary: text not null,
  meta: text not null,
  points: text (mode: "json") not null,  // string[]
  position: integer not null,
  createdAt / updatedAt: integer (timestamp_ms), default nowMs
}

projects: {
  id: text primary key,            // createId("prj")
  shortCode: text not null,        // e.g. "YH", "XC"
  name: text not null,
  kicker: text not null,
  theme: text not null,
  summary: text not null,
  goals: text (mode: "json") not null,  // string[]
  stats: text (mode: "json") not null,  // [{ k, v }]
  position: integer not null,
  createdAt / updatedAt: integer (timestamp_ms), default nowMs
}

contactReps: {
  id: text primary key,            // createId("rep")
  role: text not null,
  scope: text not null,
  email: text not null,
  position: integer not null,
  createdAt / updatedAt: integer (timestamp_ms), default nowMs
}

articles: {
  id: text primary key,            // createId("art")
  slug: text unique not null,
  title: text not null,
  category: text not null,
  readMinutes: integer not null,
  author: text not null,
  publishedAt: integer (timestamp_ms) not null,
  dek: text not null,
  abstract: text not null,
  sections: text (mode: "json") not null,   // [{ h, body, figure }]
  components: text (mode: "json") not null, // { title, items: [{ name, def, ex }] }
  questions: text (mode: "json") not null,  // string[]
  refs: text (mode: "json") not null,       // string[]
  createdAt / updatedAt: integer (timestamp_ms), default nowMs
}

contactSubmissions: {
  id: text primary key,            // createId("cts")
  name: text not null,
  organization: text not null,
  email: text not null,
  orgSegment: text not null,       // "within_ls" | "outside_ls" | "not_sure"
  message: text not null,
  createdAt: integer (timestamp_ms), default nowMs
}

articleFeedback: {
  id: text primary key,            // createId("fbk")
  articleId: text not null references articles.id (onDelete: "cascade"),
  rating: integer not null,        // 1-5
  comment: text nullable,
  createdAt: integer (timestamp_ms), default nowMs
}
```

No JSON columns exist elsewhere in the schema yet, but Drizzle's
`text(..., { mode: "json" })` is the standard SQLite escape hatch for the
fixed-shape arrays above (hero stats, competencies, service points, project
goals/stats, article body) — normalizing each into its own child table would
add five join tables for data that's never queried independently of its
parent row.

### Permissions

Add a new role `"content"` to `roleKeys` in `src/server/auth/permissions.ts`,
with a new permission action `"content:manage"` granted to it — a dedicated
role distinct from `member_admin`, so a comms/PR officer can edit the public
site without also getting roster/nav/submissions access.

Add `"submission:view"` as well, granted to the existing `member_admin` role
(the role that already owns roster/nav/quick-links admin) — unchanged from
the previous revision of this design.

## Public write paths

- `POST /api/contact` — public, unauthenticated. Validates body shape, rate
  limits via the existing `checkRateLimit` helper (bucket keyed by IP),
  inserts into `contactSubmissions`. No audit log entry — there's no actor to
  attribute it to.
- `POST /api/articles/[slug]/feedback` — same shape, inserts into
  `articleFeedback`.

Both routes skip `Actor`-based authorization (they're intentionally public)
and rely on rate limiting as the spam guard.

## Repositories

Public reads (no actor check, used by the public pages):
- `orgProfile.ts` — `get()`
- `services.ts`, `projects.ts`, `contactReps.ts` — `list()` (ordered by `position`)
- `articles.ts` — `list()`, `getBySlug(slug)`

Admin writes (gated by `can(actor, "content:manage")`, following the existing
repository pattern in e.g. `quickLinks.ts`):
- `orgProfile.ts` — `update(actor, input)`
- `services.ts`, `projects.ts`, `contactReps.ts`, `articles.ts` —
  `create(actor, input)`, `update(actor, id, input)`, `remove(actor, id)`,
  `reorder(actor, orderedIds)`

Submission reads/writes (separate concern, `submission:view` / public create):
- `contactSubmissions.ts`, `articleFeedback.ts` — `create(input)` (no actor,
  public) and `list(actor)` (gated by `can(actor, "submission:view")`)

Each list/create/update mutation calls `audit.record(actor, …)` the same way
`quickLinks.ts` does, so content edits show up in the existing audit log.

## Admin panel

Two new areas under `/portal/admin`, each its own module card on the
dashboard, gated by their respective permission:

- **`/portal/admin/content`** (`content:manage`) — sub-pages `org-profile`
  (single edit form), `services`, `projects`, `contact-reps`, `articles`
  (each a list view with create/edit/delete and drag-or-arrow reordering,
  following the list+form pattern already used by `roster`/`surveys`).
- **`/portal/admin/submissions`** (`submission:view`) — two tabs (existing
  `tabs.tsx`), "Contact" and "Article feedback", each a table (existing
  `table.tsx`) of rows newest-first. Read-only.

## Visual conversion

The mockups are inline-style JSX using CSS vars (`var(--navy)`, `var(--mid)`,
etc.) defined in `design/tokens.css`. Those map directly onto Tailwind tokens
already in `src/app/globals.css` (`--primary` = navy `#06192f`, `--accent` =
mid blue). Pages are rebuilt as Tailwind + existing shadcn primitives
(`Card`, `Button`, `Badge`, `Input`, `Textarea`, `Select`, `Tabs`), following
`Home`'s current pattern (`bg-primary text-primary-foreground`,
radial-gradient hero overlay via an absolutely-positioned div) rather than
porting the mockups' `style={}` objects verbatim.

A shared `<PlaceholderBlock label ratio>` component (gray block + caption)
replaces the mockups' `Placeholder` for photo/map slots — real assets swap in
later with no layout change.

## Testing

- Repository tests: `*.integration.test.ts` per existing convention covering
  create/update/remove/reorder and the `content:manage` / `submission:view`
  permission gates for each new repository.
- API route tests: rate-limit behavior and validation for both public POST
  routes.
- No page-level/component tests exist elsewhere in the app for static pages;
  this design doesn't add any either. All public pages now read from the DB
  on every request, so they move to `force-dynamic` (matching the existing
  rule: `force-static` only when content has no per-request state, which no
  longer applies once Home/Services/Projects/Contact read `orgProfile` /
  `services` / `projects` / `contactReps`).

## Migration & seeding

- Drizzle migration adds the six new tables.
- Dev seed data is updated to insert one `orgProfile` row, the 3 `services`,
  2 `projects`, 3 `contactReps`, and 3 `articles` rows from the current
  `design/data.jsx` content, so the public site renders the same copy it has
  today immediately after migrating — only the source of truth moves.

## Deployment

Per `CLAUDE.md`: after the schema migration, run `pnpm db:migrate:dev` then
`pnpm deploy:dev`, with the exact `wrangler` command shown for approval
before it runs.
