import { describe, expect, it } from "vitest";
import type { Actor } from "@/server/auth/permissions";
import { adminGroups, adminHeading, crumbFor, visibleGroups } from "./nav";

const superActor: Actor = { memberId: "m1", roles: ["super"] };
const linkOnly: Actor = { memberId: "m2", roles: ["link"] };
const retentionActor: Actor = { memberId: "m3", roles: ["retention"] };
const releaseFlags = {
	retention: false,
	library: false,
	announcements: false,
	notifications: false,
	surveys: false,
	publicSite: false,
};
const betaFlags = { ...releaseFlags, retention: true, library: true, announcements: true, notifications: true, surveys: true, publicSite: true };

describe("admin nav registry", () => {
	it("has 4 groups with the spec's routes", () => {
		expect(adminGroups.map((group) => group.segment)).toEqual(["members", "content", "data", "system"]);
		expect(adminGroups.find((group) => group.segment === "members")?.pages.map((page) => page.href)).toEqual([
			"/portal/admin/members/list",
			"/portal/admin/members/roles",
		]);
		const eventsAndPoints = adminGroups.find((group) => group.segment === "data");
		expect(eventsAndPoints?.label).toBe("Events & Points");
		expect(eventsAndPoints?.pages.map((page) => page.segment)).toEqual([
			"dashboard",
			"events",
			"members",
			"scans",
			"ledger",
			"event-types",
			"point-types",
			"exports",
		]);
	});

	it("gates events and points pages on retention:record", () => {
		const group = adminGroups.find((item) => item.segment === "data");
		for (const segment of ["events", "members", "scans", "ledger"]) {
			expect(group?.pages.find((page) => page.segment === segment)?.permission).toBe("retention:record");
		}
	});

	it("keeps existing permission visibility when beta modules are enabled", () => {
		expect(visibleGroups(superActor, betaFlags)).toHaveLength(4);
		const visible = visibleGroups(linkOnly, betaFlags).flatMap((group) => group.pages.map((page) => page.href));
		expect(visible).toContain("/portal/admin/content/links");
		expect(visible).toContain("/portal/admin/system/audit");
		expect(visible).not.toContain("/portal/admin/members/roles");
	});

	it("shows Point Types only to retention configuration holders", () => {
		expect(visibleGroups(retentionActor, betaFlags).flatMap((group) => group.pages.map((page) => page.href))).toContain(
			"/portal/admin/system/point-types",
		);
		expect(visibleGroups(linkOnly, betaFlags).flatMap((group) => group.pages.map((page) => page.href))).not.toContain(
			"/portal/admin/system/point-types",
		);
	});

	it("builds breadcrumbs and headings for admin paths", () => {
		expect(crumbFor("/portal/admin/members")).toEqual([
			{ label: "Admin", href: "/portal/admin" },
			{ label: "Members & Access" },
		]);
		expect(crumbFor("/portal/admin/members/roles")).toEqual([
			{ label: "Admin", href: "/portal/admin" },
			{ label: "Members & Access", href: "/portal/admin/members" },
			{ label: "Roles & Access" },
		]);
		expect(crumbFor("/portal/admin/system/point-types")).toEqual([
			{ label: "Admin", href: "/portal/admin" },
			{ label: "Events & Points", href: "/portal/admin/data" },
			{ label: "Point Types" },
		]);
		expect(adminHeading("/portal/admin")).toEqual({ section: "Admin", title: "Console" });
		expect(adminHeading("/portal/admin/members")).toEqual({ section: "Admin", title: "Members & Access" });
		expect(adminHeading("/portal/admin/members/roles")).toEqual({ section: "Members & Access", title: "Roles & Access" });
		expect(adminHeading("/portal/library")).toBeNull();
	});

	describe("visibleGroups", () => {
	it("hides deferred content but keeps approved admin tools", () => {
		const hrefs = visibleGroups(superActor, releaseFlags).flatMap((group) => group.pages.map((page) => page.href));
		expect(hrefs).not.toContain("/portal/admin/content/library");
		expect(hrefs).not.toContain("/portal/admin/content/announcements");
		expect(hrefs).not.toContain("/portal/admin/content/surveys");
		expect(hrefs).toContain("/portal/admin/content/links");
		expect(hrefs).toContain("/portal/admin/members/list");
		expect(hrefs).toContain("/portal/admin/system/nav-pins");
		expect(hrefs).toContain("/portal/admin/system/quick-links");
		expect(hrefs).toContain("/portal/admin/system/audit");
		expect(hrefs).toContain("/portal/admin/data/events");
		expect(hrefs).toContain("/portal/admin/system/point-types");
	});
	});
});
