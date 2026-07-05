"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { Download, Maximize2, Moon, Save, Sun, Upload, X } from "lucide-react";
import type { QrStyle } from "@/db/repositories/links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const NAVY_LOGO = "/code-falcon-transparent.svg";
const WHITE_LOGO = "/code-falcon-white.svg";

export const ORG_QR_STYLE: QrStyle = {
	foreground: "#06192F",
	background: "#FFFFFF",
	logoUrl: NAVY_LOGO,
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
	onUploadLogo?(file: File): Promise<string | null>;
	onSave?(): void;
};

function cleanStyle(style?: QrStyle): QrStyle {
	return { ...ORG_QR_STYLE, ...(style ?? {}) };
}

// Tag the encoded target so a scan is attributable. On-page copy/open links stay bare,
// so only genuine scans carry the marker. The redirect maps ?s=qr to a "qr scan" stat.
function withSource(url: string, source: string): string {
	try {
		const target = new URL(url);
		target.searchParams.set("s", source);
		return target.toString();
	} catch {
		return url;
	}
}

function luminance(hex: string): number {
	const value = hex.replace("#", "");
	if (value.length < 6) return 1;
	const r = parseInt(value.slice(0, 2), 16) / 255;
	const g = parseInt(value.slice(2, 4), 16) / 255;
	const b = parseInt(value.slice(4, 6), 16) / 255;
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function StyledLinkQr({ url, style, downloadName = "short-link-qr", editable = false, onChange, onUploadLogo, onSave }: StyledQrProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fullCanvasRef = useRef<HTMLCanvasElement>(null);
	const [pngUrl, setPngUrl] = useState<string | null>(null);
	const [svgUrl, setSvgUrl] = useState<string | null>(null);
	const [fullscreen, setFullscreen] = useState(false);
	const [uploading, setUploading] = useState(false);
	const qrStyle = useMemo(() => cleanStyle(style), [style]);
	const qrContent = useMemo(() => withSource(url, "qr"), [url]);
	const lightBackground = luminance(qrStyle.background) >= 0.5;

	useEffect(() => {
		renderCanvas(canvasRef.current, qrContent, qrStyle, 232).then(setPngUrl).catch(() => setPngUrl(null));
		QRCode.toString(qrContent, { type: "svg", margin: 2, errorCorrectionLevel: "H", color: { dark: qrStyle.foreground, light: qrStyle.background } })
			.then((svg) => setSvgUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`))
			.catch(() => setSvgUrl(null));
	}, [qrContent, qrStyle]);

	useEffect(() => {
		if (!fullscreen) return;
		renderCanvas(fullCanvasRef.current, qrContent, qrStyle, Math.min(window.innerWidth, window.innerHeight) * 0.72).catch(() => {});
	}, [fullscreen, qrContent, qrStyle]);

	useEffect(() => {
		if (!fullscreen) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setFullscreen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => {
			document.body.style.overflow = previous;
			window.removeEventListener("keydown", closeOnEscape);
		};
	}, [fullscreen]);

	function patch(patchStyle: Partial<QrStyle>) {
		onChange?.({ ...qrStyle, ...patchStyle });
	}

	// Flip the QR to its dark/light counterpart: swap fg/bg and, if the CODE logo is in
	// use, switch to the matching navy/white falcon so it stays visible on the new colors.
	function swapTheme() {
		const nextLogo = qrStyle.logoUrl === NAVY_LOGO ? WHITE_LOGO : qrStyle.logoUrl === WHITE_LOGO ? NAVY_LOGO : qrStyle.logoUrl;
		patch({ foreground: qrStyle.background, background: qrStyle.foreground, logoUrl: nextLogo });
	}

	async function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file || !onUploadLogo) return;
		setUploading(true);
		const uploadedUrl = await onUploadLogo(file);
		setUploading(false);
		if (uploadedUrl) patch({ logoUrl: uploadedUrl });
	}

	return (
		<div className="grid gap-4">
			<div className="flex justify-center">
				<div className="rounded-lg border border-border bg-white p-3">
					<canvas ref={canvasRef} aria-label={`QR code for ${url}`} className="block" />
				</div>
			</div>

			<div className="flex flex-wrap justify-center gap-2">
				<Button variant="outline" size="sm" onClick={swapTheme}>
					{lightBackground ? <Moon /> : <Sun />}
					{lightBackground ? "Dark" : "Light"}
				</Button>
				<Button variant="outline" size="sm" onClick={() => setFullscreen(true)}>
					<Maximize2 />
					Full screen
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

			{editable ? (
				<details className="rounded-md border p-3 text-sm">
					<summary className="cursor-pointer font-medium">Customize QR code</summary>
					<p className="mt-1 text-xs text-muted-foreground">Change the colors or drop in your event&rsquo;s own logo. Leave it as-is for the standard CODE look.</p>
					<div className="mt-3 grid gap-3 sm:grid-cols-2">
						<label className="grid gap-1 font-medium">
							Foreground
							<Input type="color" value={qrStyle.foreground} onChange={(event) => patch({ foreground: event.target.value })} />
						</label>
						<label className="grid gap-1 font-medium">
							Background
							<Input type="color" value={qrStyle.background} onChange={(event) => patch({ background: event.target.value })} />
						</label>
						<div className="grid gap-2 sm:col-span-2">
							<span className="font-medium">Center logo</span>
							<div className="flex flex-wrap gap-2">
								{onUploadLogo ? (
									<Button asChild variant="outline" size="sm" disabled={uploading}>
										<label className="cursor-pointer">
											<Upload />
											{uploading ? "Uploading…" : "Upload logo"}
											<input className="sr-only" type="file" accept="image/*" onChange={handleLogoFile} />
										</label>
									</Button>
								) : null}
								<Button type="button" variant="ghost" size="sm" onClick={() => patch({ logoUrl: ORG_QR_STYLE.logoUrl })}>Use CODE logo</Button>
								<Button type="button" variant="ghost" size="sm" onClick={() => patch({ logoUrl: null })}>No logo</Button>
							</div>
							<Input value={qrStyle.logoUrl ?? ""} placeholder="or paste an image URL" onChange={(event) => patch({ logoUrl: event.target.value || null })} />
							<span className="text-xs text-muted-foreground">PNG, JPG, or SVG. A square image with a transparent background works best.</span>
						</div>
						<label className="grid gap-1 font-medium">
							Logo size
							<Input type="number" min="0.1" max="0.35" step="0.01" value={qrStyle.logoSize} onChange={(event) => patch({ logoSize: Number(event.target.value) })} />
						</label>
						<label className="grid gap-1 font-medium">
							Logo margin
							<Input type="number" min="0" max="24" value={qrStyle.logoMargin} onChange={(event) => patch({ logoMargin: Number(event.target.value) })} />
						</label>
						<label className="flex items-center gap-2 font-medium sm:col-span-2">
							<input type="checkbox" checked={qrStyle.showLogoBacking} onChange={(event) => patch({ showLogoBacking: event.target.checked })} />
							Add a solid backing behind the logo
						</label>
					</div>
				</details>
			) : null}

			{fullscreen && typeof document !== "undefined"
				? createPortal(
						<div className="fixed inset-0 z-[100] grid bg-[#06192F] p-5 text-white" role="dialog" aria-modal="true">
							<button type="button" aria-label="Close full screen QR code" className="absolute right-4 top-4 grid size-10 place-items-center rounded-md border border-white/30 text-white transition-colors hover:bg-white/10" onClick={() => setFullscreen(false)}>
								<X className="size-5" />
							</button>
							<div className="m-auto grid justify-items-center gap-5 text-center">
								<div className={cn("rounded-xl bg-white p-4", qrStyle.background !== "#FFFFFF" && "border border-white/20")}>
									<canvas ref={fullCanvasRef} aria-label={`Full screen QR code for ${url}`} className="block max-h-[76dvh] max-w-[86vw]" />
								</div>
								<p className="max-w-[90vw] break-all font-semibold">{url}</p>
							</div>
						</div>,
						document.body,
					)
				: null}
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
