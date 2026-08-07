# Migration Lineage Unification

**Date:** 2026-08-07
**Status:** approved, not yet implemented
**Supersedes:** the two-directory arrangement introduced by `docs/superpowers/plans/2026-08-05-beta-to-staging-release.md`

## Problem

The project maintains two incompatible D1 migration histories.

| # | `drizzle/release-migrations` (staging, prod) | `drizzle/migrations` (beta) |
| --- | --- | --- |
| 0000 | `young_bullseye` | `young_bullseye` (identical) |
| 0001 | `member_portal_links` | `v5_drop_deferred` |
| 0002 | `link_workspace_fields` | `v5_add_foundation` |
| 0003 | `admin_members_nav` | `phase_9_rate_limit_counters` |
| 0004 | `beta_release_bridge` | `robust_blue_shield`, then 0005 to 0019 |

D1 records applied migrations by filename, so the two histories cannot be pointed at the same database. The release lineage exists because beta's `0001_v5_drop_deferred.sql` drops 17 tables with no `IF EXISTS` guard, all of which staging and production hold because the shared `0000` created them.

The arrangement works, but it carries a structural defect. `drizzle/migrations` is generated from `src/db/schema.ts` by `drizzle-kit`. `0004_beta_release_bridge.sql` was written by hand. A hand-written bridge is a second copy of the schema maintained by a person, and it has already fallen out of step.

### Measured drift

Both lineages were applied to throwaway SQLite databases and the resulting `sqlite_master` rows compared, normalising whitespace, backticks and clause spacing.

- 82 objects exist in both lineages
- 17 of those 82 differ substantively, not just cosmetically
- 39 objects exist only in the release lineage, almost all of them the vestigial `articles`, `comments`, `point_awards`, `lists` and `topics` families that beta dropped
- 16 objects exist only in the beta lineage, all library and announcements tables, which is intended because those surfaces are flagged off outside beta

### Live consequence

`src/db/schema.ts` declares `member_feed_state.tour_seen_at`. `code-nest-staged-db` instead has `announcements_seen_at` and no `tour_seen_at`. `src/db/repositories/memberFeed.ts` selects and upserts `tourSeenAt`, so those calls raise `no such column` against staging today.

`nav_pins` also differs: `created_by` is nullable on staging and `NOT NULL` in `schema.ts`, and `position` carries a default of `0` on staging and none in `schema.ts`.

Neither divergence was noticed because nothing compares the lineages. Each future release would add another hand-written bridge with the same exposure.

## Goal

Collapse to a single migration history that every environment shares, where each environment sits at a prefix of it:

- production furthest behind, holding only what has shipped
- staging one step ahead, used to rehearse the next application
- beta at the tip

Promotion becomes `wrangler d1 migrations apply` with no hand-written reconciliation, and the environments differ only in how far along the same list they are.

## Locked decisions

1. **The release lineage is the trunk.** Production holds live data and its history cannot be rewritten. Beta's history is the one that gives way.
2. **`code-nest-beta-db` will be wiped and replayed.** Its data is disposable. This is what makes unification possible.
3. **The reconciling migration is generated, not hand-written.** `drizzle-kit generate` produces it from `src/db/schema.ts` so it cannot drift from the source of truth.
4. **The tour is removed.** `GuidedTour` is never rendered and `markTourSeenAction` is never called; the feature is already dead code. No reader exists for any column of `member_feed_state`, so the whole table retires and the `tour_seen_at` divergence disappears rather than being patched.
5. **`nav_pins.created_by` becomes nullable in `schema.ts`**, matching what staging and production already have. Widening a column to nullable does not invalidate existing rows, so no data migration is needed.
6. **The 17 vestigial tables stay.** The trunk drops nothing. They are unused but harmless, and removing them is a separate decision requiring confirmation that they are empty in production.
7. **The single directory keeps the name `drizzle/migrations`.** `drizzle.config.ts`, `vitest.config.mts` and `src/db/migrate-local-sqlite.ts` already hardcode that path, so keeping the name confines the change to the wrangler configs.

## Target architecture

One directory, `drizzle/migrations`, containing the release lineage plus one generated reconciliation migration:

```
0000_young_bullseye.sql          shared origin
0001_member_portal_links.sql     production history
0002_link_workspace_fields.sql   production history
0003_admin_members_nav.sql       production history
0004_unify_schema.sql            generated from schema.ts, additive only
```

`drizzle/release-migrations` is deleted. Beta's former `0001` to `0019` are deleted; their cumulative effect survives inside `0004_unify_schema.sql`.

Config after the change:

| Config | Database | `migrations_dir` |
| --- | --- | --- |
| `wrangler.beta.jsonc` | `code-nest-beta-db` | `drizzle/migrations` |
| `wrangler.staging.jsonc` | `code-nest-staged-db` | `drizzle/migrations` |
| `wrangler.jsonc` | `code-nest-prod-db` | `drizzle/migrations` |

End state by environment:

| Environment | Applied | Notes |
| --- | --- | --- |
| production | 0000 to 0003 | unchanged by this work, receives 0004 in a later, separately approved step |
| staging | 0000 to 0004 | reset to production's state, then 0004 applied as the rehearsal |
| beta | 0000 to 0004 | wiped and replayed, then reseeded |

## Migration strategy

`code-nest-staged-db` has already applied the hand-written `0004_beta_release_bridge.sql`, so it is neither at production's state nor at the target. It is reset rather than patched, because a reset is the only way it can mirror production, and mirroring production is the entire reason staging exists.

Sequence:

1. Reset `code-nest-staged-db` and replay `0000` to `0003`, putting it at production's exact state
2. Generate `0004_unify_schema.sql` from that state against `schema.ts`
3. Prove convergence before anything else is applied
4. Apply `0004` to staging, which is the production rehearsal
5. Wipe `code-nest-beta-db`, replay `0000` to `0004`, reseed
6. Retire `drizzle/release-migrations` and repoint the configs

Production is not touched. It receives the identical, now-rehearsed `0004_unify_schema.sql` in a later piece of work.

## Verification

Three independent checks, each of which must pass before the next stage:

1. **Convergence.** After building a database from `drizzle/migrations`, `drizzle-kit generate` must produce no new migration. An empty diff is proof that the lineage and `schema.ts` agree, which is exactly the property the hand-written bridge lost.
2. **Behaviour.** The full suite must pass. `vitest.config.mts` builds its test database from the migrations directory through `readD1Migrations`, so the 459 tests run against the new lineage rather than a snapshot. This is the strongest signal available that the trunk is equivalent to what beta's code expects.
3. **Live.** After each remote application, `wrangler d1 migrations list` must report nothing pending, and a signed-in pass over the portal on staging must load the dashboard, calendar, an event, links and profile without error.

A schema-diff harness, of the kind used to produce the measurements above, is kept in the repository so the two-copies-of-the-schema failure cannot recur silently.

## Risks

| Risk | Mitigation |
| --- | --- |
| The generated `0004` does not reproduce beta's schema | Convergence check plus 459 tests run before any remote application |
| Staging reset loses data needed for testing | Staging data is synthetic by policy; the reset is what makes it a true production mirror |
| Beta wipe loses working state | Explicitly authorised; beta is reseeded from `src/db/seed` |
| `db:migrate:prod` reads `wrangler.jsonc` with no `--config` and could fire early | Already mitigated in `c047cfa`; after unification every config points at the same directory, so the failure mode disappears entirely |
| Vestigial tables confuse future readers | Documented in the directory README |

## Out of scope

- Applying anything to `code-nest-prod-db`
- Dropping the 17 vestigial tables
- Feature-flag enforcement for server actions and internal routes, which remains tasks 2 to 5 of the 2026-08-05 release plan
- Re-enabling library, announcements, notifications, retention or surveys anywhere

## Success criteria

- One migration directory; `drizzle/release-migrations` no longer exists
- All three wrangler configs point at `drizzle/migrations`
- `drizzle-kit generate` produces an empty diff
- Full test suite passes
- `migrations list` reports nothing pending for beta and staging
- Staging and beta serve the portal without schema errors
- Production is untouched and one migration behind staging, ready to receive the rehearsed file
