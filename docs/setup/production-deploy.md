# Production Deploy

Production runs as a Cloudflare Worker built by OpenNext.

## Production Bindings

The top-level Wrangler config deploys the already connected `code-nest` Worker and binds:

- `DB` to `code-nest-prod-db`
- `BUCKET` to `code-nest-prod-uploads`

Production sets:

```env
APP_ENV=production
STORAGE_MODE=binding
```

The database adapter uses `drizzle(env.DB, { schema })`. The storage adapter uses `env.BUCKET`.

## Deploy

```bash
pnpm db:migrate:prod
pnpm deploy:prod
```

`pnpm deploy:prod` passes `--env=""` so Wrangler targets the top-level production config instead of the explicit `dev` environment.

## Verify

After deploy, check:

- `/api/health` reports `APP_ENV=production`.
- Database adapter is `d1-binding`.
- Storage adapter is `r2-binding`.
- `cloudflareBindings.DB` and `cloudflareBindings.BUCKET` are true.

## Before Deploy

- Run `pnpm lint`.
- Run `pnpm typecheck`.
- Run `pnpm build`.
- Review pending migrations.
- Confirm no secret files are staged.
