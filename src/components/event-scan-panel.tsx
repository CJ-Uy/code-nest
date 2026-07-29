"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventScanOverlay } from "@/components/event-scan-overlay";

export function EventScanPanel({
	eventId,
	eventTitle,
	termId,
}: {
	eventId: string;
	eventTitle: string;
	termId: string;
}) {
	const [overlayOpen, setOverlayOpen] = useState(false);

	return (
		<Card>
			<CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-3">
					<ScanLine className="mt-0.5 size-5 shrink-0 text-accent" />
					<div>
						<p className="font-medium">You’re the scanner for {eventTitle} right now.</p>
						<p className="text-sm text-muted-foreground">Check-in is open for this event.</p>
					</div>
				</div>
				<Button type="button" onClick={() => setOverlayOpen(true)}>
					<ScanLine className="size-4" />
					Open scanner
				</Button>
				{overlayOpen ? (
					<EventScanOverlay eventId={eventId} termId={termId} canUndo={false} onClose={() => setOverlayOpen(false)} />
				) : null}
			</CardContent>
		</Card>
	);
}
