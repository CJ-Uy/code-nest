import * as React from "react";
import { cn } from "@/lib/utils";

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("inline-flex h-auto items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground", className)}
			role="tablist"
			{...props}
		/>
	);
}

interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	active?: boolean;
}

function TabButton({ className, active, ...props }: TabButtonProps) {
	return (
		<button
			className={cn(
				"inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
				active ? "bg-background text-foreground shadow-sm" : "hover:bg-background/60 hover:text-foreground",
				className,
			)}
			role="tab"
			aria-selected={active}
			{...props}
		/>
	);
}

export { TabsList, TabButton };
