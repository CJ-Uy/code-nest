# Shared Dev Deploy Note

Phase 0 changes the database schema, migrations, environment bindings, internal contracts, repository seams, and shared dev token seed shape.

Shared-mode developers depend on the deployed dev Worker staying current. After this phase is reviewed and the D1 reset commands are approved, the dev backend must be updated in this order:

1. Apply the new clean schema to `code-nest-dev-db`.
2. Seed `code-nest-dev-db` with the dev seed data.
3. Deploy `code-nest-dev`.

Exact Wrangler commands must be shown for approval before any D1 reset, migration, seed, or production database operation.
