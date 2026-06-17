# CODE Portal Rules

- Keep `/` public and reader-first. Keep the member workspace under `/portal`.
- Use the Drizzle schema in `src/db/schema.ts` as the only schema source.
- Do not expose D1 as `DATABASE_URL`.
- Do not add raw SQL internal endpoints.
- After changing schema, migrations, internal contracts, permissions, auth config, storage proxy code, or shared dev seed data, update the dev Worker path. The usual order is `pnpm db:migrate:dev` then `pnpm deploy:dev`.
- Show the exact `pnpm exec wrangler` command and wait for approval before any D1 reset, migration, seed, delete, or production-touching operation.
