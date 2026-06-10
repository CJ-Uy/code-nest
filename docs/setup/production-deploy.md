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

Cloudflare Workers build settings should be:

| Setting | Value |
| --- | --- |
| Build command | `pnpm build` |
| Deploy command | `pnpm upload:prod` |

Do not use `npx opennextjs-cloudflare build` as the Cloudflare build command. The package script runs `next build`, clears stale `.open-next` output, then runs the OpenNext build. That cleanup prevents duplicate exports in `.open-next/cloudflare/next-env.mjs`.

For local production deploys, run:

```bash
pnpm db:migrate:prod
pnpm deploy:prod
```

`pnpm deploy:prod` builds and then uploads. In Cloudflare Workers, use `pnpm build` as the build command and `pnpm upload:prod` as the deploy command so the platform does not build twice.

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
