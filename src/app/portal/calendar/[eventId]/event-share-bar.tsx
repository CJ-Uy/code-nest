"use client";

import { useState } from "react";
import { CalendarPlus, Check, Download, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Share controls for an event: the short link, plus calendar handoff.
 *
 * No participant emails travel anywhere here. The Google Calendar URL adds the event to the
 * clicking member's own calendar and nothing else — prefilling guests would put member addresses
 * into a URL, where they leak through history and referrers.
 */
export function EventShareBar({ shareUrl, googleUrl, icsUrl }: { shareUrl: string; googleUrl: string; icsUrl: string }) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard can be blocked by permissions; the link stays selectable on screen.
			setCopied(false);
		}
	}

	return (
		<div className="flex flex-wrap items-center gap-2">
			<code className="min-w-0 break-all rounded-md border border-border bg-secondary/30 px-2 py-1 text-xs">{shareUrl}</code>
			<Button type="button" variant="outline" size="sm" onClick={copy}>
				{copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
				{copied ? "Copied" : "Copy link"}
			</Button>
			<Button asChild variant="outline" size="sm">
				<a href={googleUrl} target="_blank" rel="noreferrer noopener">
					<CalendarPlus className="size-4" />
					Add to Google Calendar
				</a>
			</Button>
			<Button asChild variant="outline" size="sm">
				<a href={icsUrl}>
					<Download className="size-4" />
					.ics
				</a>
			</Button>
		</div>
	);
}
