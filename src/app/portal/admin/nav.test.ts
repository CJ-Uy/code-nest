import { describe, it, expect } from "vitest";
import type { Actor } from "@/server/auth/permissions";
import { adminGroups, visibleGroups, crumbFor } from "./nav";

const superActor: Actor = { memberId: "m1", roles: ["super"] };
const linkOnly: Actor = { memberId: "m2", roles: ["link"] };

describe("admin nav registry", () => {
	it("has 4 groups with the spec's routes", () => {
		expect(adminGroups.map((g) => g.segment)).toEqual(["members", "content", "data", "system"]);
		const members = adminGroups.find((g) => g.segment === "members")!;
		expect(members.pages.map((p) => p.href)).toEqual(["/portal/admin/members/list", "/portal/admin/members/roles"]);
	});

	it("super sees every group; link role sees only Short Links + always-visible pages", () => {
		expect(visibleGroups(superActor).length).toBe(4);
		const visible = visibleGroups(linkOnly).flatMap((g) => g.pages.map((p) => p.href));
		expect(visible).toContain("/portal/admin/content/links");
		expect(visible).toContain("/portal/admin/system/audit"); // permission null → always visible
		expect(visible).not.toContain("/portal/admin/members/roles");
	});

	it("builds a breadcrumb trail with clickable ancestors", () => {
		expect(crumbFor("/portal/admin/members/roles")).toEqual([
			{ label: "Admin", href: "/portal/admin" },
			{ label: "Members & Access", href: "/portal/admin/members" },
			{ label: "Roles & Access" },
		]);
	});

	it("marks the current page (leaf) without an href and keeps ancestors clickable on a group index", () => {
		expect(crumbFor("/portal/admin/members")).toEqual([
			{ label: "Admin", href: "/portal/admin" },
			{ label: "Members & Access" },
		]);
	});
});
