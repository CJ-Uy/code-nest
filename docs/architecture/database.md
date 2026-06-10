# Database

Drizzle schema lives at `src/db/schema.ts`.

Current starter table:

- `users.id`
- `users.email`
- `users.name`
- `users.created_at`

## Production

Production uses Cloudflare D1 directly:

```ts
const { env } = getCloudflareContext();
const db = drizzle(env.DB, { schema });
```

This happens only inside `src/db/adapters/d1.ts`.

## Shared Dev

Shared dev database access goes through an internal API with typed endpoints. It does not expose raw SQL and does not expose D1 credentials.

## Local

Local mode uses D1 bindings when running through Wrangler/OpenNext. Plain `next dev` falls back to SQLite at `LOCAL_SQLITE_PATH`.

D1 is not a normal `DATABASE_URL` database. Treat migrations and bindings as Cloudflare resources.

