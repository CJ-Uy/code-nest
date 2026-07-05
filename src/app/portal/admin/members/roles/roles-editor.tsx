"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AssignableRole } from "@/db/repositories/roles";
import type { Member } from "@/db/types";
import type { RoleKey } from "@/server/auth/permissions";
import { loadMemberRolesAction, saveMemberRolesAction, searchMembersAction } from "./actions";

type Selected = { member: Member; roleKeys: RoleKey[]; baseVersion: string };

export function RolesEditor({
	assignableRoles,
	canGrantSuper,
	actorMemberId,
}: {
	assignableRoles: AssignableRole[];
	canGrantSuper: boolean;
	actorMemberId: string;
}) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Member[]>([]);
	const [selected, setSelected] = useState<Selected | null>(null);
	const [desired, setDesired] = useState<Set<RoleKey>>(new Set());
	const [message, setMessage] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const displayName = (m: Member) => m.fullName || m.name || m.email;

	function runSearch() {
		if (query.trim().length < 2) {
			setMessage("Type at least 2 characters to search.");
			return;
		}
		setMessage(null);
		startTransition(async () => {
			try {
				setResults(await searchMembersAction(query));
			} catch {
				setResults([]);
				setMessage("Search is unavailable right now.");
			}
		});
	}

	function pickMember(member: Member) {
		setMessage(null);
		startTransition(async () => {
			const { roleKeys, baseVersion } = await loadMemberRolesAction(member.id);
			setSelected({ member, roleKeys, baseVersion });
			setDesired(new Set(roleKeys));
		});
	}

	function toggle(key: RoleKey, on: boolean) {
		setDesired((prev) => {
			const next = new Set(prev);
			if (on) next.add(key);
			else next.delete(key);
			return next;
		});
	}

	function save() {
		if (!selected) return;
		const removingOwn = selected.member.id === actorMemberId && selected.roleKeys.some((k) => !desired.has(k));
		if (removingOwn && !window.confirm("This removes your own access. Continue?")) return;
		const desiredRoleKeys = [...desired];
		setMessage(null);
		startTransition(async () => {
			try {
				const res = await saveMemberRolesAction({
					memberId: selected.member.id,
					baseVersion: selected.baseVersion,
					desiredRoleKeys,
				});
				setSelected({ ...selected, roleKeys: res.roleKeys, baseVersion: res.baseVersion });
				setDesired(new Set(res.roleKeys));
				setMessage("Saved.");
			} catch (error) {
				setMessage(error instanceof Error ? error.message : "Could not save.");
			}
		});
	}

	return (
		<div className="grid gap-5">
			<div className="grid gap-2">
				<label className="text-sm font-medium" htmlFor="member-search">
					Search member (name or email)
				</label>
				<div className="flex gap-2">
					<Input
						id="member-search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								runSearch();
							}
						}}
						placeholder="e.g. Juan or juan@code.org"
						className="max-w-sm"
					/>
					<Button type="button" onClick={runSearch} disabled={pending}>
						Search
					</Button>
				</div>
				{results.length > 0 ? (
					<ul className="grid gap-1">
						{results.map((m) => (
							<li key={m.id}>
								<button
									type="button"
									onClick={() => pickMember(m)}
									className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-accent"
								>
									<span className="font-medium">{displayName(m)}</span> <span className="text-muted-foreground">{m.email}</span>
								</button>
							</li>
						))}
					</ul>
				) : null}
			</div>

			{selected ? (
				<div className="grid gap-3 rounded-xl border border-border p-4">
					<p className="font-medium">Roles for {displayName(selected.member)}</p>
					<div className="grid gap-2">
						{assignableRoles.map((role) => {
							const disabled = !role.assignable || (role.key === "super" && !canGrantSuper);
							return (
								<label key={role.key} className="flex items-start gap-2 text-sm">
									<input
										type="checkbox"
										className="mt-1"
										checked={desired.has(role.key)}
										disabled={disabled}
										onChange={(e) => toggle(role.key, e.target.checked)}
									/>
									<span>
										<span className="font-medium">{role.label}</span>
										{role.assignable ? null : <span className="ml-1 text-xs text-muted-foreground">(coming soon)</span>}
										<span className="block text-muted-foreground">{role.description}</span>
									</span>
								</label>
							);
						})}
					</div>
					<div className="flex items-center gap-3">
						<Button type="button" onClick={save} disabled={pending}>
							Save changes
						</Button>
						{message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
					</div>
				</div>
			) : message ? (
				<p className="text-sm text-muted-foreground">{message}</p>
			) : null}
		</div>
	);
}
