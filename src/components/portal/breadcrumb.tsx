import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
	return (
		<nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
			{items.map((item, i) => (
				<span key={item.label} className="flex items-center gap-1">
					{i > 0 ? <ChevronRight className="size-3.5 opacity-60" aria-hidden /> : null}
					{item.href ? (
						<Link href={item.href} className="hover:text-foreground">
							{item.label}
						</Link>
					) : (
						<span className="font-medium text-foreground" aria-current="page">
							{item.label}
						</span>
					)}
				</span>
			))}
		</nav>
	);
}
