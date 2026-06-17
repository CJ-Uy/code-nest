# Database

Drizzle schema lives at `src/db/schema.ts`.

The Phase 0 schema includes identity, Auth.js adapter tables, roles, content, member library state, short links, CRS events, points, surveys, announcements, notifications, audit logs, shared dev tokens, and consultancy teams.

`members` is the Auth.js user table. There is no separate `users` table in the new schema.

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

Local mode uses the same Drizzle migrations against SQLite at `LOCAL_SQLITE_PATH`.

D1 is not a normal `DATABASE_URL` database. Treat migrations and bindings as Cloudflare resources.
