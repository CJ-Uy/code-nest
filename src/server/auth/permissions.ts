export const roleKeys = ["super", "member", "calendar", "publishing", "link", "crs", "member_admin"] as const;

export type RoleKey = (typeof roleKeys)[number];

export const permissionActions = [
	"event:approve",
	"points:assign",
	"link:moderate",
	"content:publish",
	"role:assign",
	"survey:configure",
	"member:manage",
	"library:read_confidential",
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
	publishing: ["content:publish", "library:read_confidential"],
	link: ["link:moderate"],
	crs: ["event:approve", "points:assign"],
	member_admin: ["member:manage", "role:assign"],
};

export function can(actor: Actor | null, action: PermissionAction): boolean {
	if (!actor) return false;
	if (actor.roles.includes("super")) return true;
	return actor.roles.some((role) => {
		if (role === "member" || role === "super") return false;
		return rolePermissions[role].includes(action);
	});
}
