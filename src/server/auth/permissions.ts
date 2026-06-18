export const roleKeys = ["super", "member", "calendar", "link", "retention", "member_admin"] as const;

export type RoleKey = (typeof roleKeys)[number];

export const permissionActions = [
	"event:approve",
	"points:assign",
	"retention:record",
	"link:moderate",
	"role:assign",
	"survey:configure",
	"member:manage",
	"roster:manage",
	"nav:configure",
] as const;

export type PermissionAction = (typeof permissionActions)[number];

export type Actor = {
	memberId: string;
	roles: RoleKey[];
	context?: "session" | "shared_dev_token";
	sharedTokenHash?: string | null;
	sharedTokenLabel?: string | null;
};

const rolePermissions: Record<Exclude<RoleKey, "super" | "member">, PermissionAction[]> = {
	calendar: [],
	link: ["link:moderate"],
	retention: ["event:approve", "points:assign", "retention:record"],
	member_admin: ["member:manage", "role:assign", "roster:manage", "nav:configure"],
};

export function can(actor: Actor | null, action: PermissionAction): boolean {
	if (!actor) return false;
	if (actor.roles.includes("super")) return true;
	return actor.roles.some((role) => {
		if (role === "member" || role === "super") return false;
		return rolePermissions[role].includes(action);
	});
}
