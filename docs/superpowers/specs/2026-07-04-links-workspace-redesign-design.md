# Link Shortener Workspace Redesign — Design

Date: 2026-07-04
Area: `/portal/links`
Status: Approved for planning

## Goal

Turn the members-only, own-links-only shortener into a shared, table-driven
workspace: every member sees every link, edits/deletes only their own, browses
with tags and filters, and opens a per-link analytics popup with charts. Each
member's Google avatar becomes their identity across the app.

## Current state (as-built)

- `shortLinks` table: `id, slug, destinationUrl, title, ownerMemberId, clickCount,
  previewTitle, previewDescription, previewImageKey, createdAt, updatedAt`. No tags.
- `linkDailyStats`: `(linkId, date, referrerBucket, deviceBucket) -> count`. Stats
  already aggregated server-side in `links.getStats`.
- `members.image` already holds the Google OAuth avatar URL (written by Auth.js).
  Never surfaced — `Actor` carries only `memberId`, `roles`, `context`.
- `LinksRepository.listOwn` (member) and `listAll` (moderator only). Edit/delete
  gated to owner-or-`link:moderate` in `loadOwned` — correct, unchanged.
- Portal page (`src/app/portal/links/page.tsx`) renders `listOwn`.
- `LinksWorkspace` is a card list + right-hand detail panel (details/stats/qr tabs),
  stats shown as plain tables.
- `src/app/portal/links/[id]/page.tsx` renders full analytics (hand-rolled bars +
  time series) + QR customizer.
- Shared-env path: `/api/links` proxies to `/internal/links` via
  `proxySharedApiRequest`, which **drops query params** and has its own handler
  (`createLinksInternalHandlers`), separate from `createLinksHandlers`.
- No chart library installed. No `Avatar` UI component (Radix `avatar` primitive is
  available via the installed `radix-ui` package).

## Decisions (locked)

- Tags: **free-form**, stored as a **JSON string array in a single `tags` column**.
  No tags table, no admin UI. Autocomplete suggestions come from tags already
  present in the loaded set.
- QR styling: **per-link saved JSON in a single `qr_style` column**. No separate
  preset table. The default is the CODE organization look: navy modules, white
  background, CODE falcon logo centered, high error correction, and dots hidden
  behind the logo. Owners and moderators may change colors, logo image URL,
  logo size, logo margin, and whether logo backing is shown. Any member who can
  open a link detail can view and scan that saved QR style.
- Visibility: **fully visible to members** — any logged-in member sees all links
  and their destinations. No unlisted/private flag.
- Charts: **add `recharts`**. Client-only component, zero Worker cost.
- Detail interaction: **Radix Dialog popup is primary**; the existing `[id]` page
  stays as a deep-linkable/printable fallback. Both consume **one shared set of
  chart components**.
- Owner column: avatar + name; render `—` when a link has no resolvable owner.
- Filtering/sorting is **entirely client-side** over a single server-loaded dataset
  — avoids the shared-proxy query-param limitation and adds no endpoints.
- Short links are served at **bare root `/<slug>`**, not `/l/<slug>`. Canonical URL
  generation, QR codes, and copy actions all use `/<slug>`. `/l/<slug>` is kept as a
  **301 alias** so existing printed/QR links keep working.
- **Read access follows visibility**: any member may read any link's detail + stats
  (the whole point of a shared table). Only **write** (edit/delete) stays owner-or-
  moderator. This requires loosening the read guard — see Backend.

## Data model

Migration adds two columns:

```
short_links.tags  text   -- JSON array of strings, e.g. ["event","social"]; nullable
short_links.qr_style  text   -- saved QR style JSON; nullable means org default
```

- Read: parse JSON, default `[]` on null/parse-error.
- Write: `JSON.stringify(tags)`; empty array stored as `[]` or null.
- QR style read: parse JSON, default to the org preset on null/parse-error.
- QR style write: merge over the org preset, validate hex colors, logo size
  `0.1-0.35`, logo margin `0-24`, and image URL as same-origin path or http(s).
- No index (client-side filtering; link volume is small).
- ponytail: single JSON column over a join table — tags are filter labels, not
  entities. Upgrade path if tags ever need their own metadata/ownership: promote to
  a `link_tags` table.
- ponytail: single QR style JSON column over a preset table. Upgrade path if teams
  need reusable branded presets: promote saved styles to `link_qr_presets`.

## Backend

### Repository (`src/db/repositories/links.ts`)

- New `listVisible(actor, page?)`: returns **all** links (any member), newest first,
  `LEFT JOIN members` to attach `owner: { id, name, image } | null`. Include parsed
  `tags`.
- `listOwn` / `listAll`: also attach `owner` + `tags` for shape consistency.
- Define a `LinkListItem = ShortLink & { owner: LinkOwner | null; tags: string[] }`
  type; list methods return `LinkListItem[]`. `getById`/`getStats` keep the flat
  `ShortLink` (owner/tags added where needed).
- `create` / `update`: accept optional `tags: string[]` and `qrStyle`; validate each tag
  (trimmed, 1–24 chars, max ~10 tags), store as JSON. **Return an enriched
  `LinkListItem`** (owner + parsed tags), not a flat `ShortLink`, so the client can
  patch its in-memory list without a refetch. (Fixes review blocker #2/major #5.)
- **Read guard loosened** (fixes review blocker #1): `getById` and `getStats` must
  allow **any member** to read **any** link — drop the `loadOwned` ownership check on
  the read paths (keep the link-exists check). Introduce `loadReadable` (exists-only)
  for reads; `loadOwned` stays for `update`/`remove` only.
- Write permissions **unchanged**: `update`/`remove` still go through `loadOwned`
  (owner-or-`link:moderate`).

### Contract (`src/db/contract/links.ts`)

- Add `linkOwnerSchema = { id, name: nullable, image: nullable }`.
- Add `qrStyleSchema` and `linkListItemSchema = linkOutputSchema.extend({ owner: linkOwnerSchema.nullable(), tags: string[], qrStyle: qrStyleSchema })`.
- New op `listVisible` (`auth: member`, `sharedDev: allow`), output `{ links: linkListItemSchema[] }`.
- `listOwn` / `listAll` outputs switch to `linkListItemSchema[]`.
- `create` / `update` inputs gain optional `tags: z.array(z.string().trim().min(1).max(24)).max(10)` and optional `qrStyle`.
- **`create` / `update` OUTPUTS switch to `{ link: linkListItemSchema }`** (owner +
  tags), matching the enriched repo return.
- `get` / `stats` stay `auth: member` — now reachable by any member (read guard
  loosened server-side), so no contract permission change needed.

### Handlers

- `createLinksHandlers.collection` GET: **default (no scope) → `listVisible`**
  (was `listOwn`). `?scope=all` → `listAll` (moderator). `?scope=own` → `listOwn`.
- `createLinksInternalHandlers` (shared Worker): mirror the owner-join + tags in its
  own query and default to the visible list, so the proxied path returns the same
  shape without needing query params.
- `create` / `update`: pass `tags` and `qrStyle` through.

## Slug routing (`/<slug>` at root)

Move short links from `/l/<slug>` to bare `/<slug>`.

- **New route** `src/app/[slug]/route.ts` — dynamic segment at root; resolves the slug
  and returns the redirect (reusing `buildRedirectResponse`). In the App Router,
  static routes (`/portal`, `/signin`, `/api`, `/`, all marketing pages) take
  precedence over `[slug]`, so real pages are never shadowed. Unknown slug → 404.
- **`buildRedirectResponse`**: stop stripping `^/l/`; take the slug from the route
  param (or strip only the leading `/`). Keep crawler-preview + click-recording as-is.
- **`shortLinkUrl`** (`src/components/links/urls.ts`): emit `/<slug>` (canonical).
  All QR/copy/open surfaces inherit this.
- **`/l/<slug>` legacy alias**: keep `src/app/l/[slug]/route.ts`, but have it **301 →
  `/<slug>`** (or resolve directly). Prevents breaking existing printed/QR links.
  Flag for removal later; not this pass.
- **Reserved slugs** (`RESERVED_SLUG_DEFAULTS`, currently
  `["portal","admin","api","l","signin","internal"]`): expand to cover **every real
  top-level route** so members can't claim a shadowed slug. Verified real top-level
  dirs in `src/app` to add: **`contact`, `product`, `projects`, `services`** (plus the
  already-listed `portal`, `admin`, `api`, `l`, `signin`, `internal`). Re-enumerate
  `src/app` at implementation time in case dirs were added, plus static assets
  (`favicon.ico`, `robots.txt`, `sitemap.xml`, `_next`). `create`
  rejects any reserved slug (already wired via `reservedSlugs` table + defaults).
  ponytail: enumerate once from the real route tree; no dynamic route-introspection.
- **Collision note**: reservation is a UX guard, not security — a shadowed slug simply
  never resolves (the page wins). No auth impact.
- Tests: `/<slug>` resolves + records a click; reserved/real-route slug is rejected on
  create; `/l/<slug>` 301s to `/<slug>`; unknown slug 404s.

## Frontend

### `Avatar` component (`src/components/ui/avatar.tsx`)

- Wrap Radix `avatar` primitive: `<Avatar image={url} name={name} />` → shows image,
  falls back to initials (or a neutral glyph for `—`/no owner). Sizes `sm`/`md`.
- Reused anywhere a member is shown (owner column, dialog header).

### `LinksWorkspace` → table

- Server component loads `listVisible(actor)` once and passes `initialLinks` +
  `actorMemberId` + `canModerate`.
- **Instructions**: a compact, collapsible "How short links work" block at the top
  (what a short link is, how `/<slug>` resolves, that stats are click-based).
- **Create form**: retained; adds a free-form tags input (chip input, autocompletes
  from tags in the loaded set).
- **Table** columns: Owner (avatar+name or `—`) · Title · Short link (`/<slug>`
  + copy) · Tags (chips) · Clicks · Created · Actions.
  - Actions: Copy, Open, QR for everyone; **Edit + Delete only when
    `link.ownerMemberId === actorMemberId` or `canModerate`**.
  - Row click (outside action buttons) opens the detail dialog.
- **Filters (client-side, in-memory)**:
  - View segmented control: `All` · `Mine` · `Most clicked` (sort by clickCount desc).
  - Tag filter: clickable chips (union of loaded tags); multi-select AND/OR — default
    OR (any selected tag matches).
  - Search box: matches title, slug, destination.
- **Refresh**: re-fetch `/api/links` (now the visible list) and replace state.

### Detail dialog + charts

- Radix Dialog opened per link. Fetches `/api/links/{id}/stats`.
- Content: stat tiles (total clicks, days tracked, top referrer, top device),
  **Clicks-over-time (recharts area/line)**, **Referrers + Devices (recharts bars)**,
  QR with saved style controls, and — for owner/moderator — inline edit
  (title, destination, tags, preview title/description, preview image upload).
- QR panel: render the saved style for everyone. Owners/moderators can edit
  foreground/background colors, center image URL, logo size, logo margin, and logo
  backing. Defaults use CODE navy, white, and `/code-falcon-transparent.svg`.
  Export PNG and SVG. Include a **Full Screen Viewing** button that opens a
  full-viewport QR presentation for mobile or desktop public display.
- **Shared chart components** (`src/components/links/charts.tsx`): `ClicksOverTime`,
  `BucketBars`. Used by both the dialog and the `[id]` page (which is refactored to
  consume them, replacing its hand-rolled SVG).
- **recharts**: pin a React-19-compatible version (`recharts@^2.15`) and confirm
  `pnpm build` (Next 16 + OpenNext) passes. **Fallback**: keep the same
  `ClicksOverTime`/`BucketBars` prop shape but render inline SVG (the `[id]` page
  already ships this) if the build breaks — the swap stays contained. (Review minor #9.)

## Data flow

1. Portal page (server) → `links.listVisible(actor)` → `LinksWorkspace initialLinks`.
2. Client filters/sorts/searches in memory — no network.
3. Row click → Dialog → `GET /api/links/{id}/stats` → recharts.
4. Owner edits in dialog → `PATCH /api/links/{id}` (incl. tags) → update in-memory list.
5. Create → `POST /api/links` (incl. tags) → prepend to list.
6. Delete (owner/mod) → `DELETE /api/links/{id}` → remove from list.

Shared env: identical, because the default GET carries no query params and both the
direct and internal handlers return the enriched shape.

## Error handling

- Owner join null → `owner: null` → UI renders `—`.
- Tags JSON parse failure → treat as `[]` (never throw in a list path).
- Tag validation errors surface as the existing `validation` link error (400).
- Non-owner PATCH/DELETE → existing `not_authorized` (403); UI hides those controls
  anyway (defense in depth, not the only guard).
- Stats fetch failure in dialog → inline "Could not load stats" message.

## Testing

- Repo: `listVisible` returns all links with owner join + parsed tags; tags
  round-trip on create/update; non-owner update/delete still throws `not_authorized`;
  **non-owner `getById`/`getStats` now SUCCEED** (read guard loosened).
- **Update existing tests for the routing change** (they assert old `/l` behavior):
  `src/components/links/link-qr.test.ts`, `src/server/links/redirect.test.ts`,
  `src/app/l/[slug]/route.test.ts`. New canonical `/<slug>`; `/l/<slug>` → 301.
- Contract/handler: default GET returns visible list; `?scope=own`/`all` honored;
  tags accepted and validated on create/update.
- Internal handler: returns the same enriched shape.
- Component: table renders rows; edit/delete controls absent for non-owned rows;
  client filters (mine/most-clicked/tag/search) narrow the set correctly.
- Charts: shared components render given a stats fixture (smoke).
- QR style: org default renders with center logo; style round-trips on
  create/update; non-owner can view saved style but cannot edit it; fullscreen view
  opens from the QR popup.

## Deploy sequence (CLAUDE.md compliance)

Schema changed → migration + dev Worker update required. Exact commands shown and
**approval awaited** before any D1-touching step:

1. `pnpm db:generate`
2. (approval) `pnpm exec wrangler d1 migrations apply DB --env dev --remote`  (= `pnpm db:migrate:dev`)
3. `pnpm deploy:dev`

No production D1 or deploy in this work.

## Out of scope (YAGNI)

- Per-link privacy / unlisted flag.
- Tags table + admin management UI + server-side tag index.
- Bulk actions, CSV export of links, link expiry.
- Changing **click-recording / crawler-preview** logic. (Slug *extraction* in
  `buildRedirectResponse` does change for `/<slug>` — that part is in scope.)

## Acceptance criteria

- [ ] Any member sees all links in a table with owner avatar+name (or `—`).
- [ ] A member's own Google avatar renders as their icon (owner column + dialog).
- [ ] Edit/Delete visible and functional only on own links (moderators: all).
- [ ] Free-form tags can be added on create/edit and shown as chips.
- [ ] Filters work: All / Mine / Most clicked, tag chips, and text search.
- [ ] Row click opens a popup with recharts click-over-time + referrer/device bars.
- [ ] QR popup shows the saved styled QR for every visible link.
- [ ] Owners/moderators can customize and save QR colors and center image.
- [ ] QR popup has a Full Screen Viewing mode for mobile and desktop display.
- [ ] Short links resolve at bare `/<slug>`; canonical URLs/QR use `/<slug>`.
- [ ] `/l/<slug>` 301-redirects to `/<slug>`; unknown slug 404s; real routes unshadowed.
- [ ] Reserved-slug list covers all real top-level routes; create rejects them.
- [ ] Instructions block present and understandable.
- [ ] `[id]` page still works, using the shared chart components.
- [ ] Migration generated; dev Worker updated after approval; no prod changes.
- [ ] Tests above pass; `pnpm typecheck` and `pnpm lint` clean.

## Implementation build order (for Codex)

Do these in order; run `pnpm typecheck` + `pnpm test` after each backend step.

1. **Schema + migration**: add `tags text` and `qr_style text` to `short_links`; `pnpm db:generate`. STOP
   before applying — surface the exact `wrangler d1 migrations apply` command for
   human approval (CLAUDE.md rule). Do NOT run any D1 or deploy command yourself.
2. **Repo** (`src/db/repositories/links.ts`): `listVisible` (all + owner join +
   parsed tags); enriched `LinkListItem` return from `create`/`update`; `loadReadable`
   (exists-only) for `getById`/`getStats`; keep `loadOwned` for `update`/`remove`;
   accept/validate/store `tags` and `qrStyle`.
3. **Contract** (`src/db/contract/links.ts`): `linkOwnerSchema`, `linkListItemSchema`;
   `listVisible` op (`auth: member`); list + create + update outputs → list-item shape;
   create/update inputs gain `tags` and `qrStyle`.
4. **Handlers**: direct `collection` GET default → `listVisible` (`?scope=own|all`
   preserved); mirror owner-join + tags + visible default in
   `src/server/internal/links.ts`; pass `tags` and `qrStyle` through create/update.
5. **Slug routing**: `src/app/[slug]/route.ts` (root resolve via
   `buildRedirectResponse`); change slug extraction to the route param; `shortLinkUrl`
   → `/<slug>`; make `/l/[slug]` 301 → `/<slug>`; expand `RESERVED_SLUG_DEFAULTS`
   (add `contact,product,projects,services` + assets); update the 3 existing tests.
6. **UI foundation**: `src/components/ui/avatar.tsx` (Radix avatar + initials
   fallback); `src/components/links/charts.tsx` (`ClicksOverTime`, `BucketBars` via
   recharts, inline-SVG fallback); shared styled QR renderer using the existing
   `qrcode` dependency, CODE logo default, export, and fullscreen presentation.
7. **Workspace rewrite** (`src/components/links/links-workspace.tsx`): table, owner
   column, instructions block, tags chip input, client filters (All/Mine/Most-clicked
   + tag chips + search), row-click Radix Dialog with charts + QR customizer/fullscreen + owner-only inline edit;
   gate Edit/Delete by `actorMemberId`/`canModerate`. Page passes `actorMemberId`.
8. **Refactor `[id]` page** to consume the shared chart components.
9. **Verify**: `pnpm typecheck`, `pnpm lint`, `pnpm test` all green. Then hand back the
   migration + `pnpm deploy:dev` commands for approval.
