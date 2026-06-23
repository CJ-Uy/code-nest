import Link from "next/link";
import { ORG } from "@/content/site";

export function SiteFooter() {
	return (
		<footer className="border-t border-border bg-card">
			<div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
				<div>
					<p className="font-heading text-lg text-foreground">{ORG.name}</p>
					<p className="mt-1 max-w-sm text-sm text-muted-foreground">{ORG.full}</p>
				</div>
				<div className="text-sm">
					<p className="font-medium text-foreground">Explore</p>
					<ul className="mt-2 grid gap-1 text-muted-foreground">
						<li><Link className="hover:text-foreground" href="/services">Services</Link></li>
						<li><Link className="hover:text-foreground" href="/projects">Projects</Link></li>
						<li><Link className="hover:text-foreground" href="/product">Product Center</Link></li>
						<li><Link className="hover:text-foreground" href="/contact">Contact</Link></li>
					</ul>
				</div>
				<div className="text-sm">
					<p className="font-medium text-foreground">Reach us</p>
					<ul className="mt-2 grid gap-1 text-muted-foreground">
						<li><a className="hover:text-foreground" href={`mailto:${ORG.email}`}>{ORG.email}</a></li>
						<li><a className="hover:text-foreground" href={ORG.fbUrl} target="_blank" rel="noreferrer">{ORG.fb}</a></li>
						<li>{ORG.room}</li>
					</ul>
				</div>
			</div>
			<div className="border-t border-border">
				<div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
					<p>© {new Date().getFullYear()} {ORG.name}. {ORG.campus}.</p>
					<Link className="hover:text-foreground" href="/signin">Member sign in</Link>
				</div>
			</div>
		</footer>
	);
}
