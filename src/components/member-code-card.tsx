"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { encodeMemberCode } from "@/lib/member-code";

export function MemberCodeCard({ memberId }: { memberId: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [error, setError] = useState<string | null>(null);
	const payload = encodeMemberCode(memberId);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		QRCode.toCanvas(canvas, payload, { width: 220, margin: 1 }).catch(() => setError("Could not render the code."));
	}, [payload]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>My member code</CardTitle>
				<CardDescription>Show this to an event admin to be marked present. It does not change.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center gap-3">
				<canvas ref={canvasRef} aria-label="Member attendance QR code" className="rounded-md border bg-white p-2" />
				<p className="font-mono text-xs text-muted-foreground">{payload}</p>
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
			</CardContent>
		</Card>
	);
}
