"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canUseCameraScanner } from "@/lib/camera-scanner-support";

// BarcodeDetector is a native browser API not yet in the TS DOM lib.
type DetectedBarcode = { rawValue: string };
type Detector = { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> };
declare global {
	interface Window {
		BarcodeDetector?: new (opts?: { formats?: string[] }) => Detector;
	}
}

export function CameraScanner({ onCode }: { onCode: (code: string) => void }) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const onCodeRef = useRef(onCode);
	const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [active, setActive] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		onCodeRef.current = onCode;
	}, [onCode]);

	const supported = canUseCameraScanner();

	useEffect(() => {
		if (!active || !supported) return;
		let stream: MediaStream | null = null;
		let raf = 0;
		let cancelled = false;
		const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;

		async function loop() {
			const video = videoRef.current;
			if (cancelled || !video) return;
			try {
				const code = detector ? (await detector.detect(video))[0]?.rawValue : scanWithJsQr(video);
				if (code) {
					const now = Date.now();
					// Debounce: one badge held in front of the camera marks once, not every frame.
					if (code !== lastRef.current.code || now - lastRef.current.at > 2500) {
						lastRef.current = { code, at: now };
						onCodeRef.current(code);
					}
				}
			} catch {
				// frame not ready yet — keep scanning
			}
			raf = requestAnimationFrame(loop);
		}

		function scanWithJsQr(video: HTMLVideoElement) {
			if (!video.videoWidth || !video.videoHeight) return null;
			const canvas = (canvasRef.current ??= document.createElement("canvas"));
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (!ctx) return null;
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
			return jsQR(frame.data, frame.width, frame.height)?.data ?? null;
		}

		(async () => {
			try {
				stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
				if (cancelled) return;
				const video = videoRef.current;
				if (!video) return;
				video.srcObject = stream;
				await video.play();
				loop();
			} catch {
				setError("Camera access was blocked. Allow the camera, or use the search below.");
				setActive(false);
			}
		})();

		return () => {
			cancelled = true;
			cancelAnimationFrame(raf);
			stream?.getTracks().forEach((track) => track.stop());
		};
	}, [active, supported]);

	if (!supported) {
		return (
			<p className="text-xs text-muted-foreground">
				Camera scanning isn’t supported on this browser. Use the search below to mark members present.
			</p>
		);
	}

	return (
		<div className="grid gap-2">
			{active ? (
				<div className="relative overflow-hidden rounded-lg border border-border bg-black">
					<video ref={videoRef} className="h-56 w-full object-cover" playsInline muted />
					<div className="pointer-events-none absolute inset-10 rounded-lg border-2 border-white/70" aria-hidden />
				</div>
			) : null}
			<Button
				type="button"
				variant={active ? "outline" : "default"}
				size="sm"
				onClick={() => {
					setError(null);
					setActive((a) => !a);
				}}
			>
				{active ? (
					<>
						<CameraOff className="size-4" /> Stop camera
					</>
				) : (
					<>
						<Camera className="size-4" /> Scan with camera
					</>
				)}
			</Button>
			{error ? <p className="text-xs text-destructive">{error}</p> : null}
		</div>
	);
}
