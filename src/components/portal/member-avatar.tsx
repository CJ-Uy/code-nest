import { cn } from "@/lib/utils";

export type MemberAvatarProps = {
	initials: string;
	className?: string;
};

// Initials-only avatar. No image upload exists in the data model, so we render
// the member's initials on the accent tint rather than pulling a photo.
export function MemberAvatar({ initials, className }: MemberAvatarProps) {
	return (
		<span
			aria-hidden
			className={cn(
				"inline-grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground",
				className,
			)}
		>
			{initials}
		</span>
	);
}
