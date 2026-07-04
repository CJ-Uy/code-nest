"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Maximize2, Save } from "lucide-react";
import type { QrStyle } from "@/db/repositories/links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const ORG_QR_STYLE: QrStyle = {
	foreground: "#06192F",
	background: "#FFFFFF",
	logoUrl: "/code-falcon-transparent.svg",
	logoSize: 0.28,
	logoMargin: 8,
	showLogoBacking: true,
};

type StyledQrProps = {
	url: string;
	style?: QrStyle;
	downloadName?: string;
	editable?: boolean;
	onChange?(style: QrStyle): void;
	onSave?(): void;
};

function cleanStyle(style?: QrStyle): QrStyle {
	return { ...ORG_QR_STYLE, ...(style ?? {}) };
}

export function StyledLinkQr({ url, style, downloadName = "short-link-qr", editable = false, onChange, onSave }: StyledQrProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fullCanvasRef = useRef<HTMLCanvasElement>(null);
	const [pngUrl, setPngUrl] = useState<string | null>(null);
	const [svgUrl, setSvgUrl] = useState<string | null>(null);
	const [fullscreen, setFullscreen] = useState(false);
	const qrStyle = useMemo(() => cleanStyle(style), [style]);

	useEffect(() => {
		renderCanvas(canvasRef.current, url, qrStyle, 232).then(setPngUrl).catch(() => setPngUrl(null));
		QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "H", color: { dark: qrStyle.foreground, light: qrStyle.background } })
			.then((svg) => setSvgUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`))
			.catch(() => setSvgUrl(null));
	}, [url, qrStyle]);

	useEffect(() => {
		if (!fullscreen) return;
		renderCanvas(fullCanvasRef.current, url, qrStyle, Math.min(window.innerWidth, window.innerHeight) * 0.72).catch(() => {});
	}, [fullscreen, url, qrStyle]);

	function patch(patchStyle: Partial<QrStyle>) {
		onChange?.({ ...qrStyle, ...patchStyle });
	}

	return (
		<div className="grid gap-4">
			<div className="flex justify-center">
				<div className="rounded-lg border border-border bg-white p-3">
					<canvas ref={canvasRef} aria-label={`QR code for ${url}`} className="block" />
				</div>
			</div>

			{editable ? (
				<div className="grid gap-3 sm:grid-cols-2">
					<label className="grid gap-1 text-sm font-medium">
						Foreground
						<Input type="color" value={qrStyle.foreground} onChange={(event) => patch({ foreground: event.target.value })} />
					</label>
					<label className="grid gap-1 text-sm font-medium">
						Background
						<Input type="color" value={qrStyle.background} onChange={(event) => patch({ background: event.target.value })} />
					</label>
					<label className="grid gap-1 text-sm font-medium sm:col-span-2">
						Center image
						<Input value={qrStyle.logoUrl ?? ""} onChange={(event) => patch({ logoUrl: event.target.value || null })} />
					</label>
					<label className="grid gap-1 text-sm font-medium">
						Logo size
						<Input type="number" min="0.1" max="0.35" step="0.01" value={qrStyle.logoSize} onChange={(event) => patch({ logoSize: Number(event.target.value) })} />
					</label>
					<label className="grid gap-1 text-sm font-medium">
						Logo margin
						<Input type="number" min="0" max="24" value={qrStyle.logoMargin} onChange={(event) => patch({ logoMargin: Number(event.target.value) })} />
					</label>
					<label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
						<input type="checkbox" checked={qrStyle.showLogoBacking} onChange={(event) => patch({ showLogoBacking: event.target.checked })} />
						Logo backing
					</label>
				</div>
			) : null}

			<div className="flex flex-wrap justify-center gap-2">
				<Button variant="outline" size="sm" onClick={() => setFullscreen(true)}>
					<Maximize2 />
					Full Screen Viewing
				</Button>
				<Button asChild variant="secondary" size="sm" disabled={!pngUrl}>
					<a href={pngUrl ?? "#"} download={`${downloadName}.png`}>
						<Download />
						PNG
					</a>
				</Button>
				<Button asChild variant="outline" size="sm" disabled={!svgUrl}>
					<a href={svgUrl ?? "#"} download={`${downloadName}.svg`}>
						<Download />
						SVG
					</a>
				</Button>
				{editable && onSave ? (
					<Button size="sm" onClick={onSave}>
						<Save />
						Save QR
					</Button>
				) : null}
			</div>

			{fullscreen ? (
				<div className="fixed inset-0 z-50 grid bg-[#06192F] p-5 text-white" role="dialog" aria-modal="true">
					<button type="button" className="absolute right-4 top-4 rounded-md border border-white/30 px-3 py-2 text-sm" onClick={() => setFullscreen(false)}>
						Close
					</button>
					<div className="m-auto grid justify-items-center gap-5 text-center">
						<div className={cn("rounded-xl bg-white p-4", qrStyle.background !== "#FFFFFF" && "border border-white/20")}>
							<canvas ref={fullCanvasRef} aria-label={`Full screen QR code for ${url}`} className="block max-h-[76dvh] max-w-[86vw]" />
						</div>
						<p className="max-w-[90vw] break-all font-semibold">{url}</p>
					</div>
				</div>
			) : null}
		</div>
	);
}

async function renderCanvas(canvas: HTMLCanvasElement | null, url: string, style: QrStyle, cssSize: number): Promise<string | null> {
	if (!canvas) return null;
	const dpr = Math.min(window.devicePixelRatio || 1, 3);
	const size = Math.max(180, Math.round(cssSize)) * dpr;
	await QRCode.toCanvas(canvas, url, { width: size, margin: 2, errorCorrectionLevel: "H", color: { dark: style.foreground, light: style.background } });
	canvas.style.width = `${Math.round(size / dpr)}px`;
	canvas.style.height = `${Math.round(size / dpr)}px`;
	if (style.logoUrl) await drawLogo(canvas, style);
	return canvas.toDataURL("image/png");
}

function drawLogo(canvas: HTMLCanvasElement, style: QrStyle): Promise<void> {
	return new Promise((resolve) => {
		const ctx = canvas.getContext("2d");
		if (!ctx || !style.logoUrl) return resolve();
		const logo = new Image();
		logo.crossOrigin = "anonymous";
		logo.onload = () => {
			const center = canvas.width / 2;
			const badge = canvas.width * style.logoSize;
			if (style.showLogoBacking) {
				ctx.beginPath();
				ctx.arc(center, center, badge / 2 + style.logoMargin, 0, Math.PI * 2);
				ctx.fillStyle = style.background;
				ctx.fill();
			}
			const scale = (badge * 0.72) / Math.max(logo.width, logo.height);
			const width = logo.width * scale;
			const height = logo.height * scale;
			ctx.drawImage(logo, center - width / 2, center - height / 2, width, height);
			resolve();
		};
		logo.onerror = () => resolve();
		logo.src = style.logoUrl;
	});
}
