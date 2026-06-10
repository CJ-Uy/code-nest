# Env Vars

| Name | Required | Used by | Example | Outside dev safe | Secret |
| --- | --- | --- | --- | --- | --- |
| `APP_ENV` | Yes | all modes | `local` | Yes | No |
| `STORAGE_MODE` | Yes | all modes | `local` | Yes | No |
| `ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE` | No | production emergency | `true` | No | No |
| `SHARED_API_BASE_URL` | When `APP_ENV=shared` | shared | `https://dev-api.example.com` | Yes | No |
| `SHARED_API_TOKEN` | When `APP_ENV=shared` | shared | `provided_token` | Yes | Yes |
| `R2_ACCOUNT_ID` | When `STORAGE_MODE=r2-s3` | shared/local storage | `8527...` | Yes | No |
| `R2_BUCKET_NAME` | When `STORAGE_MODE=r2-s3` | shared/local storage | `code-nest-dev-uploads` | Yes | No |
| `R2_ACCESS_KEY_ID` | When `STORAGE_MODE=r2-s3` | shared/local storage | `dev_key_id` | Yes | Yes |
| `R2_SECRET_ACCESS_KEY` | When `STORAGE_MODE=r2-s3` | shared/local storage | `dev_secret` | Yes | Yes |
| `R2_ENDPOINT` | When `STORAGE_MODE=r2-s3` | shared/local storage | `https://<account_id>.r2.cloudflarestorage.com` | Yes | No |
| `LOCAL_SQLITE_PATH` | No | local | `./.local/dev.db` | Yes | No |
| `LOCAL_STORAGE_DIR` | No | local | `./.local/uploads` | Yes | No |

Production D1 and R2 are Cloudflare bindings, not env secrets.
