"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminEntry, AssignableRole } from "@/db/repositories/roles";
import type { Member } from "@/db/types";
import type { RoleKey } from "@/server/auth/permissions";
import { loadMemberRolesAction, saveMemberRolesAction, searchMembersAction } from "./actions";

type Editor = { memberId: string; displayName: string; baseVersion: string; original: RoleKey[]; desired: Set<RoleKey> };

export function RolesManager({
	admins,
	assignableRoles,
	canGrantSuper,
	actorMemberId,
}: {
	admins: AdminEntry[];
	assignableRoles: AssignableRole[];
	canGrantSuper: boolean;
	actorMemberId: string;
}) {
	const router = useRouter();
	const [filter, setFilter] = useState("");
	const [addOpen, setAddOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Member[]>([]);
	const [editor, setEditor] = useState<Editor | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const labelOf = new Map(assignableRoles.map((role) => [role.key, role.label]));
	const memberName = (m: Member) => m.fullName || m.name || m.email;

	const q = filter.trim().toLowerCase();
	const shown = q
		? admins.filter(
				(a) =>
					a.displayName.toLowerCase().includes(q) ||
					a.email.toLowerCase().includes(q) ||
					a.roleKeys.some((k) => (labelOf.get(k) ?? k).toLowerCase().includes(q)),
			)
		: admins;

	function openEditor(memberId: string, displayName: string) {
		setMessage(null);
		startTransition(async () => {
			const { roleKeys, baseVersion } = await loadMemberRolesAction(memberId);
			setEditor({ memberId, displayName, baseVersion, original: roleKeys, desired: new Set(roleKeys) });
			setAddOpen(false);
			setResults([]);
			setQuery("");
		});
	}

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

	function toggle(key: RoleKey, on: boolean) {
		setEditor((prev) => {
			if (!prev) return prev;
			const desired = new Set(prev.desired);
			if (on) desired.add(key);
			else desired.delete(key);
			return { ...prev, desired };
		});
	}

	function save() {
		if (!editor) return;
		const removingOwn = editor.memberId === actorMemberId && editor.original.some((k) => !editor.desired.has(k));
		if (removingOwn && !window.confirm("This removes your own access. Continue?")) return;
		const desiredRoleKeys = [...editor.desired];
		setMessage(null);
		startTransition(async () => {
			try {
				await saveMemberRolesAction({ memberId: editor.memberId, baseVersion: editor.baseVersion, desiredRoleKeys });
				setEditor(null);
				setMessage("Saved.");
				router.refresh();
			} catch (error) {
				setMessage(error instanceof Error ? error.message : "Could not save.");
			}
		});
	}

	return (
		<div className="grid gap-4">
			<div className="flex flex-wrap items-center gap-2">
				<Input
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					placeholder="Search admins by name, email, or role"
					className="max-w-sm"
				/>
				<Button
					type="button"
					onClick={() => {
						setAddOpen((v) => !v);
						setEditor(null);
					}}
				>
					+ Add new admin
				</Button>
			</div>

			{addOpen ? (
				<div className="grid gap-2 rounded-xl border border-border p-4">
					<p className="text-sm font-medium">Add a new admin</p>
					<div className="flex gap-2">
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									runSearch();
								}
							}}
							placeholder="Search member by name or email"
							className="max-w-sm"
						/>
						<Button type="button" variant="outline" onClick={runSearch} disabled={pending}>
							Search
						</Button>
					</div>
					{results.length > 0 ? (
						<ul className="grid gap-1">
							{results.map((m) => (
								<li key={m.id}>
									<button
										type="button"
										onClick={() => openEditor(m.id, memberName(m))}
										className="w-full rounded-lg border border-border px-3 py-2 text-left text-sm hover:border-accent"
									>
										<span className="font-medium">{memberName(m)}</span> <span className="text-muted-foreground">{m.email}</span>
									</button>
								</li>
							))}
						</ul>
					) : null}
				</div>
			) : null}

			{editor ? (
				<div className="grid gap-3 rounded-xl border border-accent/50 bg-accent/5 p-4">
					<p className="font-medium">Roles for {editor.displayName}</p>
					<div className="grid gap-2">
						{assignableRoles.map((role) => {
							const disabled = !role.assignable || (role.key === "super" && !canGrantSuper);
							return (
								<label key={role.key} className="flex items-start gap-2 text-sm">
									<input
										type="checkbox"
										className="mt-1"
										checked={editor.desired.has(role.key)}
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
						<Button type="button" variant="outline" onClick={() => setEditor(null)}>
							Cancel
						</Button>
						{message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
					</div>
				</div>
			) : message ? (
				<p className="text-sm text-muted-foreground">{message}</p>
			) : null}

			<div className="overflow-x-auto rounded-xl border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
						<tr>
							<th className="px-4 py-2 font-semibold">Member</th>
							<th className="px-4 py-2 font-semibold">Email</th>
							<th className="px-4 py-2 font-semibold">Roles</th>
							<th className="px-4 py-2 text-right font-semibold">Action</th>
						</tr>
					</thead>
					<tbody>
						{shown.length === 0 ? (
							<tr>
								<td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
									{admins.length === 0 ? "No admins yet — add one." : "No matches."}
								</td>
							</tr>
						) : (
							shown.map((a) => (
								<tr key={a.memberId} className="border-t border-border">
									<td className="px-4 py-2 font-medium">
										{a.displayName}
										{a.memberId === actorMemberId ? <span className="ml-1 text-xs text-muted-foreground">(you)</span> : null}
									</td>
									<td className="px-4 py-2 text-muted-foreground">{a.email}</td>
									<td className="px-4 py-2">
										<div className="flex flex-wrap gap-1">
											{a.roleKeys.map((k) => (
												<span key={k} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
													{labelOf.get(k) ?? k}
												</span>
											))}
										</div>
									</td>
									<td className="px-4 py-2 text-right">
										<Button type="button" size="sm" variant="outline" onClick={() => openEditor(a.memberId, a.displayName)}>
											Edit
										</Button>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
