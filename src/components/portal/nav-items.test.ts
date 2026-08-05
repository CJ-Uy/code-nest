import { describe, expect, it, vi } from "vitest";
import { portalNavigation } from "./nav-items";

vi.mock("lucide-react", () => ({
	Award: () => null,
	Bell: () => null,
	BookOpen: () => null,
	CalendarDays: () => null,
	CircleUserRound: () => null,
	House: () => null,
	Link2: () => null,
	Megaphone: () => null,
	ShieldCheck: () => null,
}));

const disabled = {
	retention: false,
	library: false,
	announcements: false,
	notifications: false,
	surveys: false,
	publicSite: false,
};

describe("portalNavigation", () => {
	it("promotes Links into the four-slot mobile bar when Retention is disabled", () => {
		const nav = portalNavigation(disabled);
		expect(nav.primary.map((item) => item.id)).toEqual(["overview", "calendar", "links", "profile"]);
		expect(nav.secondary.map((item) => item.id)).toEqual([]);
	});

	it("keeps beta's full navigation when every module is enabled", () => {
		const nav = portalNavigation({ ...disabled, retention: true, library: true, announcements: true, notifications: true });
		expect(nav.primary.map((item) => item.id)).toEqual(["overview", "calendar", "retention", "profile"]);
		expect(nav.secondary.map((item) => item.id)).toEqual(["library", "announcements", "links", "notifications"]);
	});
});
