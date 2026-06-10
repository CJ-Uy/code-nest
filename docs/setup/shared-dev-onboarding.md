# Shared Dev Onboarding

Outside developers do not need access to the Cloudflare account.

They need:

- The repository.
- A provided `.env.local`.
- A current shared dev API token.
- Optional dev-only R2 S3 credentials for direct upload testing.

## Recommended `.env.local`

```env
APP_ENV=shared
STORAGE_MODE=api
SHARED_API_BASE_URL=https://your-shared-dev-api.example.com
SHARED_API_TOKEN=provided_token
LOCAL_SQLITE_PATH=./.local/dev.db
LOCAL_STORAGE_DIR=./.local/uploads
```

## Database Access

Shared mode uses typed internal API endpoints:

- `GET /internal/users`
- `POST /internal/users`
- `GET /internal/users/:id`

There is no raw SQL endpoint. D1 is not exposed as `DATABASE_URL`.

## Storage Options

- `STORAGE_MODE=api` routes uploads through the internal API.
- `STORAGE_MODE=r2-s3` uses dev-only R2 credentials for `code-nest-dev-uploads`.
- `STORAGE_MODE=local` uses filesystem storage for local-only testing.

If a token expires or is missing, ask the project owner for a refreshed `.env.local`. Do not request production credentials.

