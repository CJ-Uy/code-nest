# Inactive Admin Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authorized administrators find inactive invited members in the Roles & Access search and assign roles before first login.

**Architecture:** Reuse the existing member search and role-save flow. Remove only the active-status search predicate because the roles page is the method's only production caller and the role repository already accepts inactive member IDs.

**Tech Stack:** TypeScript, Drizzle ORM, Cloudflare D1, Vitest.

## Global Constraints

- Keep all existing `role:assign`, Overall Admin, optimistic concurrency, last-Overall-Admin, and audit protections unchanged.
- Keep the two-character minimum and 20-result search limit.
- Add no dependency, API, schema change, or migration.
- Do not run Playwright or another local browser on this laptop.
- Run `graphify update .` after the source change.
- Avoid em dashes in code, tests, docs, and commits.

---

### Task 1: Include inactive members in role-candidate search

**Files:**
- Modify: `src/db/repositories/roles.integration.test.ts`
- Modify: `src/db/repositories/members.ts`
- Modify generated files under: `graphify-out/`

**Interfaces:**
- Consumes: `MembersRepository.search(actor: Actor, query: string): Promise<Member[]>`.
- Produces: the same interface, now returning matching members regardless of status.

- [ ] **Step 1: Write the failing regression assertion**

Rename the existing member-search test and replace the inactive exclusion assertion with:

```ts
it("members.search: includes inactive members for role assignment", async () => {
	const { members } = repos();
	expect((await members.search(memberAdmin, "dela")).map((m) => m.email)).toContain("juan@code.org");
	expect((await members.search(memberAdmin, "JUAN@")).length).toBe(1);
	expect((await members.search(memberAdmin, "old")).map((m) => m.email)).toContain("old@code.org");
	expect(await members.search(memberAdmin, "d")).toEqual([]);
	await expect(members.search(plain, "dela")).rejects.toThrow(/Not authorized/);
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```powershell
pnpm test -- src/db/repositories/roles.integration.test.ts
```

Expected: FAIL because searching `old` returns no rows while `members.status = "active"` is enforced.

- [ ] **Step 3: Remove only the active-status predicate**

In `src/db/repositories/members.ts`, remove the unused `and` import, keep `eq` for the other repository methods, change the comment to describe status-inclusive role search, and pass the existing name/email `or(...)` predicate directly to `.where(...)`:

```ts
// SQLite LIKE is case-insensitive for ASCII; every member status, capped at 20.
return db
	.select()
	.from(members)
	.where(
		or(
			like(members.name, pattern),
			like(members.fullName, pattern),
			like(members.nickname, pattern),
			like(members.email, pattern),
		),
	)
	.limit(20);
```

- [ ] **Step 4: Run focused and full non-browser verification**

Run:

```powershell
pnpm test -- src/db/repositories/roles.integration.test.ts
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected: every command exits 0. Existing lint warnings are allowed; lint errors are not.

- [ ] **Step 5: Refresh the graph and inspect the diff**

Run:

```powershell
graphify update .
git diff --check
git status --short
```

Expected: only the planned test, repository, plan, and generated graph changes are present.

- [ ] **Step 6: Commit and push**

```powershell
git add src/db/repositories/roles.integration.test.ts src/db/repositories/members.ts graphify-out docs/superpowers/plans/2026-08-05-inactive-admin-assignment.md
git commit -m "feat: assign admin roles before first login"
git push
```
