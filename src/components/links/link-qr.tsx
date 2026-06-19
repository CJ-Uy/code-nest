"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortLinkUrl } from "./urls";

export { shortLinkUrl };

export function LinkQr({ url }: { url: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [dataUrl, setDataUrl] = useState<string | null>(null);

	useEffect(() => {
		if (canvasRef.current) {
			QRCode.toCanvas(canvasRef.current, url, { width: 192, margin: 1 }).catch(() => {});
		}
		QRCode.toDataURL(url, { width: 512, margin: 1 }).then(setDataUrl).catch(() => {});
	}, [url]);

	return (
		<div className="flex flex-col items-center gap-3">
			<canvas ref={canvasRef} className="rounded-md border" aria-label={`QR code for ${url}`} />
			<Button asChild variant="secondary" size="sm" disabled={!dataUrl}>
				<a href={dataUrl ?? "#"} download="short-link-qr.png">
					<Download />
					Download QR
				</a>
			</Button>
		</div>
	);
}
