import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
	icon: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
};

// Shared empty-state block: dashed border, centered icon + copy + optional action.
// Used by Library / Announcements / Links / Events instead of ad hoc per-page markup.
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center",
				className,
			)}
		>
			<span className="grid size-12 place-items-center rounded-full bg-secondary text-accent">
				<Icon className="size-6" />
			</span>
			<div className="space-y-1">
				<p className="font-heading text-lg text-foreground">{title}</p>
				{description ? <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p> : null}
			</div>
			{action}
		</div>
	);
}
