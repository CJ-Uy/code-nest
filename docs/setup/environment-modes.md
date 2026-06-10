# Environment Modes

`APP_ENV` controls the backend path.

| Mode | Database | Storage | Typical user |
| --- | --- | --- | --- |
| `local` | Local D1 binding if present, else SQLite at `LOCAL_SQLITE_PATH` | R2 binding if `STORAGE_MODE=binding`, else filesystem | Core contributors |
| `shared` | Internal shared dev API | `api`, `r2-s3`, or `local` based on `STORAGE_MODE` | Outside developers |
| `production` | D1 binding `env.DB` | R2 binding `env.BUCKET` | Production Worker |

`STORAGE_MODE` controls storage outside the locked production default.

| Mode | Use |
| --- | --- |
| `local` | Store files under `LOCAL_STORAGE_DIR`. |
| `api` | Send storage requests through the shared dev API. |
| `r2-s3` | Use dev-only R2 S3-compatible credentials. |
| `binding` | Use Cloudflare R2 binding `BUCKET`. |

Production ignores `STORAGE_MODE` and uses `BUCKET` unless `ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE=true` is explicitly set for an emergency.

Outside developers should use `APP_ENV=shared` with a provided `.env.local`.

