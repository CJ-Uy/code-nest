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
		let cancelled = false;
		// Render the backing store at device resolution and pin display size, so the
		// QR + center logo stay crisp on hi-DPI screens instead of being upscaled.
		const cssSize = 220;
		const dpr = Math.min(window.devicePixelRatio || 1, 3); // ponytail: cap at 3x, extra pixels are wasted
		// errorCorrectionLevel H (30% recovery) so the center logo badge stays scannable.
		QRCode.toCanvas(canvas, payload, { width: cssSize * dpr, margin: 1, errorCorrectionLevel: "H" })
			.then(() => {
				canvas.style.width = `${cssSize}px`;
				canvas.style.height = `${cssSize}px`;
				const ctx = canvas.getContext("2d");
				if (!ctx || cancelled) return;
				const logo = new Image();
				logo.onload = () => {
					if (cancelled) return;
					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = "high";
					// White circle backing keeps QR modules from showing through the transparent logo.
					const badge = canvas.width * 0.24;
					const center = canvas.width / 2;
					ctx.beginPath();
					ctx.arc(center, center, badge / 2, 0, Math.PI * 2);
					ctx.fillStyle = "#ffffff";
					ctx.fill();
					const scale = (badge * 0.72) / Math.max(logo.width, logo.height);
					const width = logo.width * scale;
					const height = logo.height * scale;
					ctx.drawImage(logo, center - width / 2, center - height / 2, width, height);
				};
				// SVG source: drawImage rasterizes it at the destination resolution, so the
			// badge stays razor-sharp at any devicePixelRatio (the PNG was only 430px).
			logo.src = "/code-falcon-transparent.svg";
			})
			.catch(() => setError("Could not render the code."));
		return () => {
			cancelled = true;
		};
	}, [payload]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>My member code</CardTitle>
				<CardDescription>Show this to an event admin to be marked present. It does not change.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center gap-3">
				<canvas ref={canvasRef} aria-label="Member attendance QR code" className="rounded-md border bg-white p-2" />
				{error ? <p className="text-sm text-destructive">{error}</p> : null}
			</CardContent>
		</Card>
	);
}
