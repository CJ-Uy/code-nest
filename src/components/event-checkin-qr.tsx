"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EventCheckinQr({ token }: { token: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		QRCode.toCanvas(canvas, token, { width: 220, margin: 1 }).catch(() => setError("Could not render the code."));
	}, [token]);

	return (
		<div className="flex flex-col items-center gap-3">
			<canvas ref={canvasRef} aria-label="Event check-in QR code" className="rounded-md border bg-white p-2" />
			<p className="text-center text-xs text-muted-foreground">
				Show this to an organizer to check in. It expires in about 5 minutes.
			</p>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
			<Button variant="outline" size="sm" onClick={() => router.refresh()}>
				<RefreshCw />
				Refresh code
			</Button>
		</div>
	);
}
