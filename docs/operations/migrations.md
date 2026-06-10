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

## Apply Shared/Dev D1

```bash
pnpm db:migrate:dev
```

## Apply Production D1

```bash
pnpm db:migrate:prod
```

Production migrations should be intentional, reviewed, and run before production deploy.

