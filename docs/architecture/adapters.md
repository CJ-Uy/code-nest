# Adapters

Adapters let app code stay independent from the active backend mode.

## Database Interface

`src/db/types.ts` exposes:

- `listMembers()`
- `createMember(input)`
- `getMemberById(id)`

Adapters:

- `D1DatabaseAdapter` for Cloudflare `env.DB`.
- `LocalSqliteDatabaseAdapter` for local SQLite.
- `SharedApiDatabaseAdapter` for typed shared dev API calls.

## Storage Interface

`src/storage/types.ts` exposes:

- `putObject(input)`
- `getObject(key)`
- `deleteObject(key)`

Adapters:

- `R2BindingStorageAdapter` for Cloudflare `env.BUCKET`.
- `R2S3StorageAdapter` for dev R2 S3-compatible credentials.
- `LocalFileStorageAdapter` for local filesystem uploads.
- `SharedApiStorageAdapter` for typed shared dev API calls.

## Adding An Adapter

Add a focused file under `src/db/adapters` or `src/storage/adapters`, implement the interface, then update `getDatabaseAdapter()` or `getStorageAdapter()`.
