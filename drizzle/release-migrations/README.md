# Release migrations (staging and production)

This directory is the migration history for `code-nest-staged-db` and `code-nest-prod-db`.
`drizzle/migrations` is a **different, incompatible history** used only by `code-nest-beta-db`.

## Why there are two

Both histories start from the same `0000_young_bullseye.sql`, then fork. They reuse the same
numbers for different files:

| # | this directory (staging, prod) | `drizzle/migrations` (beta) |
| --- | --- | --- |
| 0001 | `member_portal_links` | `v5_drop_deferred` |
| 0002 | `link_workspace_fields` | `v5_add_foundation` |
| 0003 | `admin_members_nav` | `phase_9_rate_limit_counters` |
| 0004 | `beta_release_bridge` | `robust_blue_shield` (then 0005-0019) |

D1 records applied migrations **by filename** in the `d1_migrations` table, not by number or
content. So pointing a staging or production database at `drizzle/migrations` does not skip
the work it has already done. D1 sees beta's `0001_v5_drop_deferred.sql` as a new migration
and runs it. That file drops 17 tables with no `IF EXISTS` guard, including `announcements`,
`articles`, `comments`, `point_awards`, `lists` and `topics`, all of which exist in staging
and production because the shared `0000` created them. The run then fails partway through
`0002_v5_add_foundation.sql`, which recreates `nav_pins` and re-adds the `short_links`
preview columns that this lineage already added under different filenames.

`0004_beta_release_bridge.sql` is the reconciliation. It is additive only: `CREATE TABLE`,
`ALTER TABLE ... ADD COLUMN`, `CREATE INDEX`, and no `DROP`. It brings a database on this
lineage up to the schema the beta application code expects, without replaying beta's history.

## Which config points where

| Config | Database | `migrations_dir` |
| --- | --- | --- |
| `wrangler.beta.jsonc` | `code-nest-beta-db` | `drizzle/migrations` |
| `wrangler.staging.jsonc` | `code-nest-staged-db` | `drizzle/release-migrations` |
| `wrangler.jsonc` | `code-nest-prod-db` | `drizzle/release-migrations` |

These must stay correct on **every** branch. `pnpm db:migrate:prod` passes no `--config`, so
it reads `wrangler.jsonc` from whatever tree is checked out.

## Adding a schema change

`drizzle-kit generate` writes to `drizzle/migrations`, so a new change lands on beta's
history first and reaches beta through `pnpm db:migrate:dev`. To carry it to staging and
production, hand-write the equivalent additive statements as the next numbered file here.
Keep it non-destructive: this lineage runs against databases holding live data.

Verify before and after with the read-only listing, which never writes:

```
pnpm exec wrangler d1 migrations list DB --config wrangler.staging.jsonc --remote
```
