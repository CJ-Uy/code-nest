import { z } from "zod";
import type { PermissionAction } from "@/server/auth/permissions";

export const sharedDevModeSchema = z.enum(["allow", "deny"]);
export const operationAuthSchema = z.enum(["public", "member", "admin"]);

export type InternalOperation<Input extends z.ZodType, Output extends z.ZodType> = {
	input: Input;
	output: Output;
	auth: z.infer<typeof operationAuthSchema>;
	permission?: PermissionAction;
	sharedDev: z.infer<typeof sharedDevModeSchema>;
};

export function operation<Input extends z.ZodType, Output extends z.ZodType>(
	definition: InternalOperation<Input, Output>,
): InternalOperation<Input, Output> {
	return definition;
}
