# Local Development

## Install

```bash
pnpm install
```

If local SQLite fails after install, allow the native package build:

```bash
pnpm approve-builds
```

## Run With Next

```bash
pnpm dev
```

Use `.env.local`:

```env
APP_ENV=local
STORAGE_MODE=local
LOCAL_SQLITE_PATH=./.local/dev.db
LOCAL_STORAGE_DIR=./.local/uploads
```

Plain `next dev` uses SQLite and filesystem fallbacks when Cloudflare bindings are unavailable.

## Run With Cloudflare Preview

```bash
pnpm dev:cf
```

This builds through OpenNext and starts Wrangler with the `dev` environment. It binds:

- `DB` to `code-nest-dev-db`
- `BUCKET` to `code-nest-dev-uploads`

## Reset Local State

```bash
Remove-Item -Recurse -Force .local
```

## Common Mistakes

- Missing `.env.local` means defaults are used.
- `APP_ENV=shared` requires `SHARED_API_BASE_URL` and `SHARED_API_TOKEN`.
- `STORAGE_MODE=r2-s3` requires all R2 S3 env vars.
- Local D1 migrations and SQLite fallback migrations are separate workflows.

