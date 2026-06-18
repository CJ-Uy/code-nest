# Migrations

Drizzle schema lives at `src/db/schema.ts`.

Generated migrations live under `drizzle/migrations`.

## Generate

```bash
pnpm db:generate
```

## Apply Local D1

```bash
pnpm db:migrate:local
```

## Apply Local SQLite

```bash
pnpm db:migrate:local:sqlite
```

## Apply Shared/Dev D1

```bash
pnpm db:migrate:dev
```

## Apply Production D1

```bash
pnpm db:migrate:prod
```

Production migrations should be intentional, reviewed, and run before production deploy.

## Phase 0 Clean Reset Decision

Remote dev and prod D1 inventory found only empty `users` tables plus Cloudflare metadata. The approved path is a clean reset to the new `members` schema because there is no user data to preserve.

Before running any reset, migration, or seed command, show the exact `pnpm exec wrangler` command and wait for approval. Never touch prod D1 without explicit confirmation.

The expected order after approval is:

1. Reset dev D1 to an empty database.
2. Apply `drizzle/migrations` to dev D1.
3. Seed dev D1.
4. Repeat prod reset and migration only after explicit prod confirmation.
