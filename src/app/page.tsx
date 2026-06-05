import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, KeyRound, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { publicArticles, publicResources } from "@/lib/public-content";

export default function Home() {
	const featured = publicArticles[0];

	return (
		<main className="min-h-screen bg-background text-foreground">
			<header className="border-b bg-card">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
					<Link className="flex items-center gap-3" href="/">
						<Image src="/code-logo-full-navy.png" alt="CODE" width={132} height={44} priority />
					</Link>
					<nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Public navigation">
						<Link className="hover:text-foreground" href="/articles">Articles</Link>
						<a className="hover:text-foreground" href="#library">Public library</a>
						<a className="hover:text-foreground" href="#updates">Updates</a>
					</nav>
					<Button asChild variant="ghost" size="icon" className="text-muted-foreground" aria-label="Member access">
						<Link href="/portal">
							<KeyRound />
						</Link>
					</Button>
				</div>
			</header>

			<section className="border-b bg-card">
				<div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
					<div className="flex min-h-[420px] flex-col justify-between">
						<div>
							<Badge variant="outline">Public publishing</Badge>
							<h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-normal text-foreground sm:text-6xl lg:text-7xl">
								CODE publishes what it can share.
							</h1>
							<p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
								Public articles, event notices, and learning resources live here. Member records,
								private case studies, retention tools, and internal comments stay inside the portal.
							</p>
						</div>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Button asChild>
								<Link href="/articles">
									Read public articles
									<ArrowRight />
								</Link>
							</Button>
							<Button asChild variant="outline">
								<a href="#library">Browse resources</a>
							</Button>
						</div>
					</div>

					<div className="grid min-h-[420px] grid-rows-[1fr_auto] overflow-hidden rounded-lg border bg-background">
						<div className="relative grid place-items-center border-b p-8">
							<div className="absolute inset-0 bg-[linear-gradient(90deg,var(--border)_1px,transparent_1px),linear-gradient(180deg,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
							<div className="relative grid h-48 w-48 place-items-center rounded-full border-2 border-primary bg-card p-8">
								<Image src="/code-logo-full-navy.png" alt="" width={150} height={50} />
							</div>
						</div>
						<div className="grid gap-3 p-5">
							<p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Featured</p>
							<h2 className="text-2xl font-semibold tracking-normal">{featured.title}</h2>
							<p className="text-sm leading-6 text-muted-foreground">{featured.excerpt}</p>
							<Button asChild variant="outline" className="justify-self-start">
								<Link href={`/articles/${featured.slug}`}>Open article</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Latest writing</p>
					<h2 className="mt-3 text-3xl font-semibold tracking-normal">Public articles</h2>
					<p className="mt-3 text-sm leading-6 text-muted-foreground">
						The public side is built for readers first. Internal documents stay out of sight until a member signs in.
					</p>
				</div>
				<div className="grid gap-4">
					{publicArticles.map((article) => (
						<Card key={article.slug}>
							<CardHeader className="grid gap-3 md:grid-cols-[1fr_auto]">
								<div>
									<div className="flex flex-wrap gap-2">
										<Badge variant="outline">{article.category}</Badge>
										<Badge variant="secondary">{article.date}</Badge>
									</div>
									<CardTitle className="mt-4">{article.title}</CardTitle>
									<CardDescription className="mt-2">{article.excerpt}</CardDescription>
								</div>
								<Button asChild variant="outline" size="sm">
									<Link href={`/articles/${article.slug}`}>Read</Link>
								</Button>
							</CardHeader>
						</Card>
					))}
				</div>
			</section>

			<section id="library" className="border-y bg-card">
				<div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
					<Card>
						<CardHeader>
							<CardTitle>Public library</CardTitle>
							<CardDescription>Open resources that do not expose private case details.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="relative">
								<Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input className="pl-9" placeholder="Search public resources" />
							</div>
							<div className="grid gap-2">
								{publicResources.map((resource) => (
									<div className="flex items-center justify-between rounded-md border p-3 text-sm" key={resource}>
										<span>{resource}</span>
										<FileText className="h-4 w-4 text-muted-foreground" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>
					<Card id="updates">
						<CardHeader>
							<CardTitle>Public updates</CardTitle>
							<CardDescription>Announcements meant for readers outside the member workspace.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3">
							{[
								["June general assembly", "Open notice for members and partners."],
								["Public article submissions", "Publishing is accepting new drafts."],
								["Retention guide update", "Public explainer now reflects the current CRS flow."],
							].map(([title, text]) => (
								<div className="rounded-md border p-3" key={title}>
									<div className="flex items-center gap-2">
										<CalendarDays className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm font-medium">{title}</p>
									</div>
									<p className="mt-1 text-sm text-muted-foreground">{text}</p>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</section>

			<footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
				<p>CODE public site. Private tools stay in the member portal.</p>
				<Link className="text-xs hover:text-foreground" href="/portal">Member sign in</Link>
			</footer>
		</main>
	);
}
