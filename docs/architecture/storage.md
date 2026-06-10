# Storage

Storage is selected through `getStorageAdapter()`.

## R2 Binding

Production uses `env.BUCKET` through `R2BindingStorageAdapter`.

## R2 S3-compatible

Shared or local development can use R2 S3-compatible credentials with `STORAGE_MODE=r2-s3`. These credentials must be dev-only.

## Shared API

`STORAGE_MODE=api` sends uploads and reads through the shared dev API.

Expected endpoints:

- `POST /internal/uploads`
- `GET /internal/uploads/:key`
- `DELETE /internal/uploads/:key`

## Local Filesystem

`STORAGE_MODE=local` writes files under `LOCAL_STORAGE_DIR`.

Production always uses the R2 binding unless `ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE=true` is set for a documented emergency.

