# Inactive Admin Assignment Design

## Goal

Allow an authorized administrator to find a pre-created inactive member in the **Add new admin** search and assign any role they are already permitted to grant before that member first signs in.

## Approaches considered

1. **Remove the active-only filter from the existing role-assignment member search.** This is recommended because that repository search has only one production caller, the Roles & Access page. It is the smallest change and preserves the existing save path.
2. Add an `includeInactive` option to the member search. This adds an unused default and branching for a caller distinction that does not currently exist.
3. Add a separate role-candidate search method. This duplicates the same name and email query with no present need.

## Design

The existing member search will continue requiring `role:assign` or `member:manage`, a query of at least two characters, and a maximum of 20 results. It will search members of every status instead of filtering to `active`. The role editor and role repository remain unchanged because they already accept inactive member IDs. Existing rules for assignable roles, Overall Admin grants, optimistic concurrency, last-Overall-Admin protection, and audit logging remain unchanged.

## Verification

The roles integration test will assert that the seeded inactive member is returned by name or email. The focused integration test will be run red before the filter is removed, then green after the minimal change. Type checking and the full non-browser test suite will run before the change is pushed. Browser tests remain excluded on this laptop due the confirmed NVIDIA driver blue screen.
