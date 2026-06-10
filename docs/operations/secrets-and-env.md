# Secrets And Env

## Files

| File | Committed | Purpose |
| --- | --- | --- |
| `.env.example` | Yes | Placeholder values and documentation. |
| `.env.local` | No | Local or shared dev values for one developer. |
| `.env.*.local` | No | Additional local secret files. |
| `.dev.vars` | No | Wrangler local secrets and variables. |

Outside developers receive `.env.local` out of band.

## Rotation

Rotate shared dev API tokens when a developer leaves, a token leaks, or a token expires. Send a fresh `.env.local` with the new value.

## Production

Production uses Cloudflare bindings for D1 and R2. It should not need production database or R2 secrets in `.env.local`.

R2 S3 credentials are for local or shared dev only. D1 is not exposed as `DATABASE_URL`.

