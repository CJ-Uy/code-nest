"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function MemberSearchBox({ q, rows }: { q: string; rows: number }) {
	const formRef = useRef<HTMLFormElement>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	function submit(delay = 0) {
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => formRef.current?.requestSubmit(), delay);
	}

	useEffect(() => () => {
		if (timerRef.current) clearTimeout(timerRef.current);
	}, []);

	return (
		<form ref={formRef} className="flex flex-wrap items-end gap-2">
			<input type="hidden" name="page" value="1" />
			<input type="hidden" name="rows" value={rows} />
			<Input name="q" defaultValue={q} placeholder="Search name or email" className="max-w-sm" onChange={() => submit(250)} />
		</form>
	);
}

export function MemberRowsSelect({ q, rows }: { q: string; rows: number }) {
	const formRef = useRef<HTMLFormElement>(null);

	return (
		<form ref={formRef} className="flex items-center gap-2">
			<input type="hidden" name="page" value="1" />
			{q ? <input type="hidden" name="q" value={q} /> : null}
			<span>Rows</span>
			<Select name="rows" defaultValue={String(rows)} className="w-28" onChange={() => submit()}>
				<option value="25">25 rows</option>
				<option value="50">50 rows</option>
				<option value="100">100 rows</option>
			</Select>
		</form>
	);

	function submit() {
		formRef.current?.requestSubmit();
	}
}
