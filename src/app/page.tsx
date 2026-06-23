import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { ARTICLES, COMPETENCIES, HERO_STATS, MISSION, ORG, SERVICES_INTRO, VISION, WHAT_IS_OD } from "@/content/site";

export const dynamic = "force-static";

export default function Home() {
	const featured = ARTICLES.slice(0, 3);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<SiteHeader />

			<section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
				<div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_15%_0%,rgba(73,134,172,0.35)_0%,rgba(6,25,47,0)_55%)]" />
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
					<div className="max-w-3xl">
						<Image src="/code-logo-full-white.png" alt="CODE" width={168} height={57} priority style={{ height: "auto" }} />
						<p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{ORG.tagline}</p>
						<h1 className="mt-3 font-heading text-4xl leading-tight sm:text-5xl lg:text-6xl">
							We help youth organizations develop, endure, and serve the nation.
						</h1>
						<p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">{ORG.blurb}</p>
						<div className="mt-8 flex flex-wrap gap-3">
							<Button asChild variant="secondary">
								<Link href="/services">
									Our services
									<ArrowRight />
								</Link>
							</Button>
							<Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
								<Link href="/contact">Work with us</Link>
							</Button>
						</div>
					</div>

					<dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/15 pt-8">
						{HERO_STATS.map((stat) => (
							<div key={stat.label}>
								<dt className="font-heading text-3xl text-white sm:text-4xl">{stat.value}</dt>
								<dd className="mt-1 text-sm text-white/70">{stat.label}</dd>
							</div>
						))}
					</dl>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
				<p className="mx-auto max-w-3xl text-center font-heading text-2xl leading-relaxed text-foreground sm:text-3xl">
					{SERVICES_INTRO}
				</p>
			</section>

			<section className="bg-card">
				<div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
					<Card>
						<CardHeader>
							<p className="text-xs font-semibold uppercase tracking-wide text-accent">Vision</p>
							<CardTitle className="text-xl">Where we are headed</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm leading-relaxed text-muted-foreground">{VISION}</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<p className="text-xs font-semibold uppercase tracking-wide text-accent">Mission</p>
							<CardTitle className="text-xl">What we do about it</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm leading-relaxed text-muted-foreground">{MISSION}</p>
						</CardContent>
					</Card>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<h2 className="font-heading text-3xl">Our competencies</h2>
				<div className="mt-8 grid gap-6 md:grid-cols-3">
					{COMPETENCIES.map((competency) => (
						<div key={competency.n} className="rounded-2xl border border-border p-6">
							<span className="font-heading text-4xl text-secondary-foreground/30">{competency.n}</span>
							<h3 className="mt-3 font-heading text-xl">{competency.title}</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{competency.body}</p>
						</div>
					))}
				</div>
			</section>

			<section className="bg-primary text-primary-foreground">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<div className="max-w-3xl">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">What is OD?</p>
						<p className="mt-4 font-heading text-2xl leading-relaxed sm:text-3xl">{WHAT_IS_OD}</p>
					</div>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
				<div className="flex items-end justify-between gap-4">
					<h2 className="font-heading text-3xl">From the Product Center</h2>
					<Link href="/product" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
						All articles
						<ArrowRight className="size-4" />
					</Link>
				</div>
				<div className="mt-8 grid gap-6 md:grid-cols-3">
					{featured.map((article) => (
						<Link key={article.id} href={`/product/${article.id}`} className="group flex flex-col rounded-2xl border border-border p-6 transition-colors hover:border-accent">
							<span className="text-xs font-semibold uppercase tracking-wide text-accent">{article.cat}</span>
							<h3 className="mt-2 font-heading text-xl leading-snug group-hover:text-accent">{article.title}</h3>
							<p className="mt-2 flex-1 text-sm text-muted-foreground">{article.dek}</p>
							<span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
								Read
								<ArrowUpRight className="size-4" />
							</span>
						</Link>
					))}
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
				<div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-accent p-8 text-accent-foreground sm:flex-row sm:items-center sm:p-12">
					<div>
						<h2 className="font-heading text-3xl">Have an organization to develop?</h2>
						<p className="mt-2 max-w-xl text-sm text-accent-foreground/85">
							Tell us about your org and what you are working toward. We will help you find the right engagement.
						</p>
					</div>
					<Button asChild variant="secondary" className="shrink-0">
						<Link href="/contact">
							Get in touch
							<ArrowRight />
						</Link>
					</Button>
				</div>
			</section>

			<SiteFooter />
		</div>
	);
}
