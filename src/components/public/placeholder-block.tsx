import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Stands in for photo/map slots until real assets land — same footprint, no
// layout shift when swapped.
export function PlaceholderBlock({ label, className }: { label: string; className?: string }) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-muted-foreground",
				className,
			)}
		>
			<ImageIcon className="size-6" />
			<span className="text-xs font-medium">{label}</span>
		</div>
	);
}
