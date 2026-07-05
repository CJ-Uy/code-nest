"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CameraScanner } from "@/components/camera-scanner";
import { isCheckinToken } from "@/lib/checkin-token";
import { decodeMemberCode } from "@/lib/member-code";

type ScanResult = { memberId: string; alreadyPresent: boolean };
type FoundMember = {
	memberId: string;
	fullName: string | null;
	name: string | null;
	email: string;
	alreadyScanned: boolean;
};

export function EventScanPanel({ eventId, termId }: { eventId: string; termId: string }) {
	const [scanInput, setScanInput] = useState("");
	const [log, setLog] = useState<string[]>([]);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<FoundMember[]>([]);
	const [error, setError] = useState<string | null>(null);

	async function postScan(body: { memberId: string } | { token: string }, displayId: string) {
		setError(null);
		const response = await fetch(`/api/events/${eventId}/scan`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...body, termId }),
		});
		if (!response.ok) {
			const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
			setError(errorBody?.error ?? "Scan failed. Try the manual search.");
			return;
		}
		const result = (await response.json()) as ScanResult;
		setLog((prev) => [`${result.alreadyPresent ? "Already present" : "Marked present"}: ${displayId}`, ...prev]);
	}

	async function scanMember(memberId: string) {
		await postScan({ memberId }, memberId);
	}

	async function submitScan() {
		const raw = scanInput.trim();
		// Accept either a short-lived event check-in token or the static member code.
		if (isCheckinToken(raw)) {
			setScanInput("");
			await postScan({ token: raw }, "check-in code");
			return;
		}
		const memberId = decodeMemberCode(raw);
		if (!memberId) {
			setError("That code is not a CODE member or check-in code.");
			return;
		}
		setScanInput("");
		await scanMember(memberId);
	}

	async function runSearch() {
		setError(null);
		const response = await fetch(`/api/events/${eventId}/members?q=${encodeURIComponent(query)}`);
		if (!response.ok) {
			setError("Search failed.");
			return;
		}
		const data = (await response.json()) as { members: FoundMember[] };
		setResults(data.members);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Scan attendance</CardTitle>
				<CardDescription>Scan or paste a member code, or search by name or email if scanning fails.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<CameraScanner
					onCode={(code) => {
						const memberId = decodeMemberCode(code);
						if (!memberId) {
							setError("That QR isn’t a CODE member code.");
							return;
						}
						void scanMember(memberId);
					}}
				/>

				<form
					className="flex gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						void submitScan();
					}}
				>
					<Input
						value={scanInput}
						onChange={(event) => setScanInput(event.target.value)}
						placeholder="Member code (code:m:...)"
						aria-label="Member code"
					/>
					<Button type="submit">Mark present</Button>
				</form>

				<div className="flex flex-col gap-2">
					<form
						className="flex gap-2"
						onSubmit={(event) => {
							event.preventDefault();
							void runSearch();
						}}
					>
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search name or email"
							aria-label="Search members"
						/>
						<Button type="submit" variant="secondary">
							Search
						</Button>
					</form>
					<ul className="flex flex-col gap-1">
						{results.map((member) => (
							<li key={member.memberId} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
								<span className="text-sm">
									{member.fullName ?? member.name ?? member.email}
									{member.alreadyScanned ? <span className="ml-2 text-xs text-muted-foreground">present</span> : null}
								</span>
								<Button
									size="sm"
									variant="outline"
									disabled={member.alreadyScanned}
									onClick={() => void scanMember(member.memberId)}
								>
									Mark present
								</Button>
							</li>
						))}
					</ul>
				</div>

				{error ? <p className="text-sm text-destructive">{error}</p> : null}

				<div className="flex flex-col gap-1">
					<p className="text-sm font-medium">Recent scans</p>
					<ul className="flex flex-col gap-1 text-sm text-muted-foreground">
						{log.map((line, index) => (
							<li key={`${line}-${index}`}>{line}</li>
						))}
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}
