# Agent notes

## Working style

- Keep the app simple and member-first.
- Keep `/` public and reader-first. Keep the member workspace at `/portal`.
- Use Tailwind CSS v4 tokens from `src/app/globals.css`.
- Use shadcn-style components from `src/components/ui` before adding one-off control styles.
- Use lucide icons inside buttons when an icon exists.
- Keep cards shallow. Do not place cards inside cards.
- Avoid em dashes in code comments, UI copy, docs, commits, and README text.
- Avoid generic AI-sounding wording. Use plain, specific product language.
- Use the supplied CODE palette from the brand manual: navy `#06192F`, white `#FFFFFF`, blue `#0C315C`, light blue `#D7DFE9`, dark gray `#121315`, pale blue `#90B4CC`, and supporting grays `#3D5266`, `#343B41`, `#717D89`, and `#AAAFB5`.
- Use Unna for headings and Source Sans for body text.
- Keep official logo colors intact. Do not recolor, stretch, crop, outline, shadow, or manipulate the logo.

## Product priorities

1. Public publishing home, public articles, and public resource previews.
2. Hidden or low-emphasis member access into `/portal`.
3. Signed-in member overview.
4. Private content library with filters, comments, favorites, and lists.
5. Official short links with QR export and shared stats.
6. CRS event lifecycle with scan, archive, forum, survey sample, approval, and points.
7. Shared calendar and announcements.
8. Scoped admin roles, super admin inheritance, audit logs, and replayable tours.

## Verification

- Run `pnpm lint` when lint support is available.
- Run `pnpm build` before claiming the UI compiles.
- Check mobile and desktop layouts for horizontal overflow.

## Shared dev Worker

The `shared` access mode depends on the deployed dev Worker `code-nest-dev`. It owns `code-nest-dev-db`, `code-nest-dev-uploads`, and the `/internal/*` API used by outside developers.

Redeploy the dev Worker, and migrate or seed dev D1 when needed, after changes to:

- `src/db/schema.ts` or `drizzle/migrations`.
- `src/db/contract/*` or `src/app/internal/*`.
- `src/server/auth/permissions.ts`, shared actor resolution, or shared dev token seed data.
- Seed data that outside developers rely on.
- `src/auth.ts`, `src/server/env.ts`, or `wrangler.jsonc`.
- `/internal/uploads` or `src/storage/adapters/shared-api.ts`.
- Worker runtime dependencies such as Auth.js, Drizzle, OpenNext, or Wrangler.

Show the exact `pnpm exec wrangler` command and wait for approval before any D1 reset, migration, seed, delete, or production-touching command.
