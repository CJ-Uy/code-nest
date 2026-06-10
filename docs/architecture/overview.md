# Architecture Overview

The app keeps public publishing at `/` and the member workspace at `/portal`.

Server-side infrastructure code lives in:

- `src/server` for environment and Cloudflare context access.
- `src/db` for database interfaces and adapters.
- `src/storage` for object storage interfaces and adapters.

Route handlers and feature code should use adapters instead of direct Cloudflare bindings. This keeps local, shared, and production modes behind the same app-facing calls.

## Rule

Only infrastructure and adapter code should import `src/server/cloudflare.ts` or call `getCloudflareContext()`.

