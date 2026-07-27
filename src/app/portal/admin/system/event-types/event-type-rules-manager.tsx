"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventTypeRow } from "@/db/repositories/eventTypeRules";
import { permissionActions } from "@/server/auth/permissions";
import { setEventTypeRuleAction } from "./actions";

export function EventTypeRulesManager({ rows }: { rows: EventTypeRow[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Event Type Rules</CardTitle>
				<CardDescription>
					Choose which permission a member needs to create each event type. “Any member” lets everyone create it.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{rows.map((row) => {
					const current = row.requiredPermission ?? "";
					// A rule can hold a permission string written out-of-band (not through setRequiredPermission),
					// which fails closed rather than falling open — see eventTypeRules.ts. Surface it rather than
					// silently defaulting the <select> to "Any member", which would misrepresent a locked-down type.
					//
					// This option is deliberately NOT `disabled`: per the HTML form-data-set construction
					// algorithm, a selected-but-disabled <option>'s value is dropped from the submitted
					// FormData entirely. That would make a no-op Save (the admin opens the row, sees it's
					// locked, and clicks Save without changing anything) submit no requiredPermission field
					// at all — and actions.ts's parseEventTypeRuleInput throws rather than defaulting an
					// absent field to "any member", but the row must still submit *something* for that to be
					// reachable via the actual form flow. Leaving it enabled makes Save resubmit the same
					// unrecognized string, which setRequiredPermission (repository-side) rejects with
					// "Unknown permission." — a loud, safe failure instead of a silent open.
					const isUnrecognized = current !== "" && !(permissionActions as readonly string[]).includes(current);
					return (
						<form key={row.type} action={setEventTypeRuleAction} className="flex flex-wrap items-end gap-3">
							<input type="hidden" name="type" value={row.type} />
							<label className="grid gap-1.5 text-sm">
								<span className="font-medium">{row.label}</span>
								<select
									name="requiredPermission"
									defaultValue={current}
									className="w-64 rounded-lg border border-border bg-background p-2 text-sm"
								>
									<option value="">Any member</option>
									{isUnrecognized ? (
										<option value={current}>{current} (unrecognized — locked to Super)</option>
									) : null}
									{permissionActions.map((action) => (
										<option key={action} value={action}>
											{action}
										</option>
									))}
								</select>
							</label>
							<Button type="submit" size="sm" variant="secondary">
								Save
							</Button>
						</form>
					);
				})}
			</CardContent>
		</Card>
	);
}
