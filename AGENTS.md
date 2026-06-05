# Agent notes

## Working style

- Keep the app simple and member-first.
- Use Tailwind CSS v4 tokens from `src/app/globals.css`.
- Use shadcn-style components from `src/components/ui` before adding one-off control styles.
- Use lucide icons inside buttons when an icon exists.
- Keep cards shallow. Do not place cards inside cards.
- Avoid em dashes in code comments, UI copy, docs, commits, and README text.
- Avoid generic AI-sounding wording. Use plain, specific product language.

## Product priorities

1. Signed-in member overview.
2. Private content library with filters, comments, favorites, and lists.
3. Official short links with QR export and shared stats.
4. CRS event lifecycle with scan, archive, forum, survey sample, approval, and points.
5. Shared calendar and announcements.
6. Scoped admin roles, super admin inheritance, audit logs, and replayable tours.

## Verification

- Run `pnpm lint` when lint support is available.
- Run `pnpm build` before claiming the UI compiles.
- Check mobile and desktop layouts for horizontal overflow.
