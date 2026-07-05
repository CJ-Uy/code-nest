import type { Actor } from "./permissions";
import { can, permissionActions } from "./permissions";

export function hasAnyAdminScope(actor: Actor | null): boolean {
	if (!actor) return false;
	return permissionActions.some((action) => can(actor, action));
}
