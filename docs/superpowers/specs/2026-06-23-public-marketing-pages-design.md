# Public marketing pages — design

Date: 2026-06-23

## Problem

`design/*.jsx` contains finished static mockups for Landing, Services, Projects,
Product Center (+ article detail), and Contact/SignIn. Only `Home()` (a
stripped-down version of `Landing`) was ever ported into `src/app/`. The other
pages don't exist as routes — visiting `/services`, `/projects`, `/product`, or
`/contact` 404s. Sign-in already exists at `/signin` and is out of scope.

## Goals

- Ship real Next.js routes for Services, Projects, Product Center (+ article
  detail), and Contact, and rework `/` to match the fuller `Landing()` mockup.
- Reuse existing Tailwind tokens and shadcn primitives instead of porting the
  mockups' inline `style={}` objects.
- Persist Contact form submissions and per-article feedback so officers can
  see them from the admin portal, instead of the mockups' local-only "sent"
  state.

## Out of scope

- CRUD admin UI for articles (seed-script-managed for v1).
- Email notifications on new submissions.
- Porting the mockups' `useReveal()` scroll-fade animation.
- Real photography/map assets — placeholder blocks stand in.

## Routes

| Route | Source mockup | Notes |
|---|---|---|
| `/` (rework) | `Landing()` | Hero w/ stats, intro strip, vision/mission, competencies, OD explainer, article teaser, CTA band |
| `/services` | `Services()` | 3 service cards + `ProcessBand` + CTA band |
| `/projects` | `Projects()` | Youth Huddle + XChange flagship blocks + CTA band |
| `/product` | `ProductCenter()` | Filter/search over DB-backed articles |
| `/product/[slug]` | `Article()` | Article detail + feedback form + "keep reading" |
| `/contact` | `Contact()` | Reps list + map placeholder + form (persists to DB) |

`/signin` is unchanged.

## Shared layout

Extract the header (logo + nav + "Member sign in") and footer currently
inlined in `src/app/page.tsx` into shared components reused by every public
page. Add nav links: Services, Projects, Product Center, Contact, alongside
the existing "Member sign in" button. `/portal` keeps its own separate layout
— this only affects the public site, per the project rule that `/` stays
reader-first and the member workspace stays under `/portal`.

## Content data

Static, non-DB content (`ORG`, `VISION`, `MISSION`, `COMPETENCIES`,
`WHAT_IS_OD`, `SERVICES_INTRO`, `SERVICES`, `PROJECTS`, `CONTACTS`) is ported
verbatim from `design/data.jsx` into a typed `src/content/org.ts`. This
content changes rarely and wasn't asked to be DB-backed — a schema table for
three vision/mission paragraphs and two flagship projects would be pure
overhead.

Articles (currently 3 seed pieces: Organization Identity, Human-Centered
Design, The Anatomy of Planned Change) move into a Drizzle table so future
articles don't require a code change to publish — see Schema below.

## Schema additions (`src/db/schema.ts`)

```ts
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
`text(..., { mode: "json" })` is the standard SQLite escape hatch for this
shape, and the alternative — normalizing sections/components/questions/refs
into four child tables for a 3-row seed dataset — is overhead nothing in this
project currently needs.

### Permissions

Add `"submission:view"` to `permissionActions` in
`src/server/auth/permissions.ts`, granted to the existing `member_admin` role
(the role that already owns roster/nav/quick-links admin). No new role.

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

`src/db/repositories/articles.ts` — `list()`, `getBySlug(slug)` (public reads,
no actor check); `src/db/repositories/contactSubmissions.ts` and
`articleFeedback.ts` — `create(input)` (no actor, public) and `list(actor)`
(gated by `can(actor, "submission:view")`), following the existing
repository pattern (e.g. `quickLinks.ts`).

## Admin panel

New module card on `/portal/admin` (gated by `can(actor, "submission:view")`)
linking to `/portal/admin/submissions`, which shows two tabs (existing
`tabs.tsx`) — "Contact" and "Article feedback" — each a table (existing
`table.tsx`) of rows newest-first.

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

- Repository tests: `*.integration.test.ts` per existing convention (e.g.
  `articles.integration.test.ts`, `contactSubmissions.integration.test.ts`)
  covering create/list and the `submission:view` permission gate.
- API route tests: rate-limit behavior and validation for both POST routes.
- No page-level/component tests exist elsewhere in the app for static pages;
  this design doesn't add any either — pages stay `force-static` where
  content has no per-request state (Home, Services, Projects, Contact) and
  `force-dynamic` where it reads from the DB (Product Center, Article,
  Submissions admin panel).

## Deployment

Per `CLAUDE.md`: after the schema migration, run `pnpm db:migrate:dev` then
`pnpm deploy:dev`, with the exact `wrangler` command shown for approval
before it runs.
