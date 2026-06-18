import { describe, expect, it } from "vitest";
import { can, type Actor, type PermissionAction, type RoleKey } from "./permissions";

const cases: Array<{ role: RoleKey; allowed: PermissionAction[] }> = [
	{ role: "member", allowed: [] },
	{ role: "calendar", allowed: [] },
	{ role: "publishing", allowed: ["content:publish", "library:read_confidential"] },
	{ role: "link", allowed: ["link:moderate"] },
	{ role: "crs", allowed: ["event:approve", "points:assign"] },
	{ role: "member_admin", allowed: ["member:manage", "role:assign"] },
];

const actions: PermissionAction[] = [
	"event:approve",
	"points:assign",
	"link:moderate",
	"content:publish",
	"role:assign",
	"survey:configure",
	"member:manage",
	"library:read_confidential",
];

describe("permissions", () => {
	it("denies anonymous actors", () => {
		expect(actions.every((action) => !can(null, action))).toBe(true);
	});

	it("grants every permission to super admins", () => {
		const actor: Actor = { memberId: "super", roles: ["member", "super"] };
		expect(actions.every((action) => can(actor, action))).toBe(true);
	});

	it.each(cases)("maps $role to its scoped permissions", ({ role, allowed }) => {
		const actor: Actor = { memberId: role, roles: ["member", role] };
		for (const action of actions) {
			expect(can(actor, action)).toBe(allowed.includes(action));
		}
	});
});
