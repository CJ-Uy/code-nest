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
- Visibility: **fully visible to members** — any logged-in member sees all links
  and their destinations. No unlisted/private flag.
- Charts: **add `recharts`**. Client-only component, zero Worker cost.
- Detail interaction: **Radix Dialog popup is primary**; the existing `[id]` page
  stays as a deep-linkable/printable fallback. Both consume **one shared set of
  chart components**.
- Owner column: avatar + name; render `—` when a link has no resolvable owner.
- Filtering/sorting is **entirely client-side** over a single server-loaded dataset
  — avoids the shared-proxy query-param limitation and adds no endpoints.

## Data model

Migration adds one column:

```
short_links.tags  text   -- JSON array of strings, e.g. ["event","social"]; nullable
```

- Read: parse JSON, default `[]` on null/parse-error.
- Write: `JSON.stringify(tags)`; empty array stored as `[]` or null.
- No index (client-side filtering; link volume is small).
- ponytail: single JSON column over a join table — tags are filter labels, not
  entities. Upgrade path if tags ever need their own metadata/ownership: promote to
  a `link_tags` table.

## Backend

### Repository (`src/db/repositories/links.ts`)

- New `listVisible(actor, page?)`: returns **all** links (any member), newest first,
  `LEFT JOIN members` to attach `owner: { id, name, image } | null`. Include parsed
  `tags`.
- `listOwn` / `listAll`: also attach `owner` + `tags` for shape consistency.
- Define a `LinkListItem = ShortLink & { owner: LinkOwner | null; tags: string[] }`
  type; list methods return `LinkListItem[]`. `getById`/`getStats` keep the flat
  `ShortLink` (owner/tags added where needed).
- `create` / `update`: accept optional `tags: string[]`; validate each tag
  (trimmed, 1–24 chars, max ~10 tags), store as JSON. Reuse existing owner/slug/url
  validation.
- Permissions: **unchanged**. `loadOwned` already blocks non-owner writes.

### Contract (`src/db/contract/links.ts`)

- Add `linkOwnerSchema = { id, name: nullable, image: nullable }`.
- Add `linkListItemSchema = linkOutputSchema.extend({ owner: linkOwnerSchema.nullable(), tags: string[] })`.
- New op `listVisible` (`auth: member`, `sharedDev: allow`), output `{ links: linkListItemSchema[] }`.
- `listOwn` / `listAll` outputs switch to `linkListItemSchema[]`.
- `create` / `update` inputs gain optional `tags: z.array(z.string().trim().min(1).max(24)).max(10)`.

### Handlers

- `createLinksHandlers.collection` GET: **default (no scope) → `listVisible`**
  (was `listOwn`). `?scope=all` → `listAll` (moderator). `?scope=own` → `listOwn`.
- `createLinksInternalHandlers` (shared Worker): mirror the owner-join + tags in its
  own query and default to the visible list, so the proxied path returns the same
  shape without needing query params.
- `create` / `update`: pass `tags` through.

## Frontend

### `Avatar` component (`src/components/ui/avatar.tsx`)

- Wrap Radix `avatar` primitive: `<Avatar image={url} name={name} />` → shows image,
  falls back to initials (or a neutral glyph for `—`/no owner). Sizes `sm`/`md`.
- Reused anywhere a member is shown (owner column, dialog header).

### `LinksWorkspace` → table

- Server component loads `listVisible(actor)` once and passes `initialLinks` +
  `actorMemberId` + `canModerate`.
- **Instructions**: a compact, collapsible "How short links work" block at the top
  (what a short link is, how `/l/slug` resolves, that stats are click-based).
- **Create form**: retained; adds a free-form tags input (chip input, autocompletes
  from tags in the loaded set).
- **Table** columns: Owner (avatar+name or `—`) · Title · Short link (`/l/slug`
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
  QR (existing `LinkQr`), and — for owner/moderator — inline edit
  (title, destination, tags, preview title/description, preview image upload).
- **Shared chart components** (`src/components/links/charts.tsx`): `ClicksOverTime`,
  `BucketBars`. Used by both the dialog and the `[id]` page (which is refactored to
  consume them, replacing its hand-rolled SVG).

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
  round-trip on create/update; non-owner update/delete still throws `not_authorized`.
- Contract/handler: default GET returns visible list; `?scope=own`/`all` honored;
  tags accepted and validated on create/update.
- Internal handler: returns the same enriched shape.
- Component: table renders rows; edit/delete controls absent for non-owned rows;
  client filters (mine/most-clicked/tag/search) narrow the set correctly.
- Charts: shared components render given a stats fixture (smoke).

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
- Changing redirect/click-recording logic.

## Acceptance criteria

- [ ] Any member sees all links in a table with owner avatar+name (or `—`).
- [ ] A member's own Google avatar renders as their icon (owner column + dialog).
- [ ] Edit/Delete visible and functional only on own links (moderators: all).
- [ ] Free-form tags can be added on create/edit and shown as chips.
- [ ] Filters work: All / Mine / Most clicked, tag chips, and text search.
- [ ] Row click opens a popup with recharts click-over-time + referrer/device bars.
- [ ] Instructions block present and understandable.
- [ ] `[id]` page still works, using the shared chart components.
- [ ] Migration generated; dev Worker updated after approval; no prod changes.
- [ ] Tests above pass; `pnpm typecheck` and `pnpm lint` clean.
