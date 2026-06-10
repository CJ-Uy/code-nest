# CODE Nest Docs

This folder explains how the app is built, run, deployed, and maintained. It is meant for project owners, outside developers, backend contributors, and future AI coding agents.

## Start Here

| Role | First docs |
| --- | --- |
| Project owner | [setup overview](setup/overview.md), [Cloudflare resources](setup/cloudflare-resources.md), [production deploy](setup/production-deploy.md) |
| Outside developer | [shared dev onboarding](setup/shared-dev-onboarding.md), [environment modes](setup/environment-modes.md), [commands](reference/commands.md) |
| Backend developer | [adapters](architecture/adapters.md), [database](architecture/database.md), [storage](architecture/storage.md), [migrations](operations/migrations.md) |
| Future AI coding agent | [architecture overview](architecture/overview.md), [security](architecture/security.md), [env vars](reference/env-vars.md) |

## Key Rules

- Public pages stay under `/`.
- Member workspace stays under `/portal`.
- App feature code uses adapters from `src/db` and `src/storage`.
- Cloudflare bindings are isolated in `src/server/cloudflare.ts` and adapter files.
- Production uses `env.DB` and `env.BUCKET` directly.
- Outside developers use a provided `.env.local`; they do not need Cloudflare account access.

