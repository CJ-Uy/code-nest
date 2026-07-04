import { Avatar as AvatarPrimitive } from "radix-ui";
import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type AvatarProps = {
	image?: string | null;
	name?: string | null;
	size?: "sm" | "md";
	className?: string;
};

function initials(name?: string | null): string {
	const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
	return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function Avatar({ image, name, size = "md", className }: AvatarProps) {
	const label = name?.trim() || "Unknown member";
	const fallback = initials(name);
	return (
		<AvatarPrimitive.Root
			className={cn(
				"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-primary",
				size === "sm" ? "size-7 text-[0.65rem]" : "size-9 text-xs",
				className,
			)}
			aria-label={label}
		>
			{image ? <AvatarPrimitive.Image src={image} alt="" className="size-full object-cover" /> : null}
			<AvatarPrimitive.Fallback className="flex size-full items-center justify-center font-semibold" delayMs={150}>
				{fallback || <UserRound className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden="true" />}
			</AvatarPrimitive.Fallback>
		</AvatarPrimitive.Root>
	);
}
