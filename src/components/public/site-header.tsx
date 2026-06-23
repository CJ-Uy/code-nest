import Image from "next/image";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
	{ label: "Services", href: "/services" },
	{ label: "Projects", href: "/projects" },
	{ label: "Product Center", href: "/product" },
	{ label: "Contact", href: "/contact" },
];

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
			<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
				<Link className="flex items-center gap-3" href="/" aria-label="CODE home">
					<Image src="/code-logo-full-navy.png" alt="CODE" width={132} height={45} priority style={{ height: "auto" }} />
				</Link>
				<nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
					{NAV.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							{item.label}
						</Link>
					))}
				</nav>
				<Button asChild variant="secondary" size="sm">
					<Link href="/signin">
						<KeyRound />
						Member sign in
					</Link>
				</Button>
			</div>
			{/* Mobile nav: simple scrollable row under the bar. */}
			<nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden" aria-label="Primary mobile">
				{NAV.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
					>
						{item.label}
					</Link>
				))}
			</nav>
		</header>
	);
}
