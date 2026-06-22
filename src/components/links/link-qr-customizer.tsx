"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VariantKey = "light" | "dark" | "transparent";

const VARIANTS: Record<VariantKey, { label: string; dark: string; light: string; swatch: string }> = {
	light: { label: "Navy on white", dark: "#06192f", light: "#ffffff", swatch: "bg-white" },
	dark: { label: "White on navy", dark: "#ffffff", light: "#06192f", swatch: "bg-primary" },
	transparent: { label: "Transparent", dark: "#06192f", light: "#00000000", swatch: "bg-secondary" },
};

export function LinkQrCustomizer({ url }: { url: string }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [variant, setVariant] = useState<VariantKey>("light");
	const [pngUrl, setPngUrl] = useState<string | null>(null);
	const [svgUrl, setSvgUrl] = useState<string | null>(null);
	const color = useMemo(() => ({ dark: VARIANTS[variant].dark, light: VARIANTS[variant].light }), [variant]);

	useEffect(() => {
		if (canvasRef.current) {
			QRCode.toCanvas(canvasRef.current, url, { width: 208, margin: 1, color }).catch(() => {});
		}
		QRCode.toDataURL(url, { width: 1024, margin: 2, color })
			.then(setPngUrl)
			.catch(() => setPngUrl(null));
		QRCode.toString(url, { type: "svg", margin: 2, color })
			.then((svg) => setSvgUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`))
			.catch(() => setSvgUrl(null));
	}, [url, color]);

	return (
		<div className="flex flex-col items-center gap-4">
			<div className={cn("rounded-xl border border-border p-3", variant === "transparent" && "bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:16px_16px]")}>
				<canvas ref={canvasRef} aria-label={`QR code for ${url}`} />
			</div>
			<div className="flex flex-wrap justify-center gap-2">
				{(Object.keys(VARIANTS) as VariantKey[]).map((key) => (
					<button
						key={key}
						type="button"
						onClick={() => setVariant(key)}
						className={cn(
							"flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
							variant === key ? "border-accent bg-secondary text-foreground" : "border-border text-muted-foreground hover:text-foreground",
						)}
					>
						<span className={cn("size-3 rounded-full border border-border", VARIANTS[key].swatch)} />
						{VARIANTS[key].label}
					</button>
				))}
			</div>
			<div className="flex gap-2">
				<Button asChild variant="secondary" size="sm" disabled={!pngUrl}>
					<a href={pngUrl ?? "#"} download="short-link-qr.png">
						<Download />
						PNG
					</a>
				</Button>
				<Button asChild variant="outline" size="sm" disabled={!svgUrl}>
					<a href={svgUrl ?? "#"} download="short-link-qr.svg">
						<Download />
						SVG
					</a>
				</Button>
			</div>
		</div>
	);
}
