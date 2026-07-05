import { Info } from "lucide-react";

/**
 * Compact in-context help shown at the top of an admin page or group index.
 * Keep copy to one short paragraph so it never pushes primary controls below the fold.
 */
export function AdminIntro({ title, whoFor, effect }: { title: string; whoFor: string; effect: string }) {
	return (
		<div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-sm">
			<Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
			<p className="text-muted-foreground">
				<span className="font-medium text-foreground">{title}.</span> {whoFor}. {effect}
			</p>
		</div>
	);
}
