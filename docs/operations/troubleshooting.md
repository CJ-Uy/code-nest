# Troubleshooting

## Missing Binding Errors

Check `wrangler.jsonc` for `DB` and `BUCKET`. Run:

```bash
pnpm cf-typegen:dev
```

## Missing Env Vars

Run `/api/health` and check `requiredEnv`. It only reports presence, not values.

## Wrong APP_ENV

Use:

```env
APP_ENV=local
```

for plain local work, or:

```env
APP_ENV=shared
```

with shared API credentials.

## R2 Credential Errors

Confirm all `R2_*` vars are present and point to the dev bucket. Do not use production bucket credentials.

## D1 Migration Issues

Generate first with `pnpm db:generate`, then apply to the intended target. Production uses `pnpm db:migrate:prod`.

## Shared API Token Issues

Request a refreshed `.env.local` from the project owner. Do not ask for D1 credentials.

## Production Trying S3

Production should report storage adapter `r2-binding`. If it does not, remove `ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE=true`.

