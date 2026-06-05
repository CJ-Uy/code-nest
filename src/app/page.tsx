import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, KeyRound, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { publicArticles, publicResources } from "@/lib/public-content";

const articleAssets = ["/code-doc-cover.png", "/code-form-cover.png", "/code-falcon-transparent.png"];

export default function Home() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<header className="border-b bg-card">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
					<Link className="flex items-center gap-3" href="/" aria-label="CODE home">
						<Image src="/code-logo-full-navy.png" alt="CODE" width={140} height={48} priority style={{ height: "auto" }} />
					</Link>
					<nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Public navigation">
						<Link className="hover:text-foreground" href="/articles">Articles</Link>
						<a className="hover:text-foreground" href="#library">Library</a>
						<a className="hover:text-foreground" href="#updates">Updates</a>
					</nav>
					<Button asChild variant="ghost" size="icon" className="text-muted-foreground" aria-label="Member access">
						<Link href="/portal">
							<KeyRound />
						</Link>
					</Button>
				</div>
			</header>

			<section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
				<Image
					src="/code-doc-cover.png"
					alt=""
					fill
					priority
					sizes="100vw"
					className="pointer-events-none -z-10 object-cover object-center opacity-20 mix-blend-screen"
				/>
				<div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#06192F_0%,rgba(6,25,47,0.92)_48%,rgba(6,25,47,0.76)_100%)]" />
				<div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
					<div className="max-w-3xl">
						<Image src="/code-logo-full-white.png" alt="CODE" width={176} height={60} priority style={{ height: "auto" }} />
						<Badge className="mt-8 border-white/25 bg-white/10 text-white" variant="outline">
							Public publishing
						</Badge>
						<h1 className="mt-5 text-6xl font-bold text-white sm:text-7xl lg:text-8xl">CODE</h1>
						<p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
							Public articles, event notices, and open resources are kept here. Member records, private case
							studies, retention tools, and internal comments stay inside the portal.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row">
							<Button asChild variant="secondary">
								<Link href="/articles">
									Read public articles
									<ArrowRight />
								</Link>
							</Button>
							<Button asChild className="border-white/35 bg-transparent text-white hover:bg-white/10" variant="outline">
								<a href="#library">Browse resources</a>
							</Button>
						</div>
					</div>
				</div>
				<div className="border-t border-white/20 bg-[#0C315C]/70">
					<div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 text-sm text-white/80 sm:px-6 md:grid-cols-3 lg:px-8">
						<p>Articles for public reading</p>
						<p>Resource previews without private records</p>
						<p>Quiet member access when needed</p>
					</div>
				</div>
			</section>

			<section className="border-b bg-card">
				<div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
					<div>
						<p className="text-xs font-semibold uppercase text-muted-foreground">Public pages</p>
						<h2 className="mt-3 text-4xl font-bold">Readers get the front door.</h2>
						<p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
							The public site keeps external reading simple. The portal remains available for members without
							competing with publishing.
						</p>
					</div>
					<div className="grid gap-4 md:grid-cols-3">
						{[
							["Articles", "Public writing and explainers.", "/articles"],
							["Library", "Open resources and templates.", "#library"],
							["Updates", "Notices for readers and partners.", "#updates"],
						].map(([title, text, href]) => (
							<Card key={title}>
								<CardHeader>
									<CardTitle>{title}</CardTitle>
									<CardDescription>{text}</CardDescription>
								</CardHeader>
								<CardContent>
									<Button asChild variant="outline" size="sm">
										<Link href={href}>
											Open
											<ArrowRight />
										</Link>
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			<section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
				<div>
					<p className="text-xs font-semibold uppercase text-muted-foreground">Latest writing</p>
					<h2 className="mt-3 text-4xl font-bold">Public articles</h2>
					<p className="mt-4 text-sm leading-6 text-muted-foreground">
						Published pages give readers the useful frame. Confidential notes, member comments, and private
						case records stay out of public view.
					</p>
				</div>
				<div className="grid gap-4">
					{publicArticles.map((article, index) => (
						<Card key={article.slug}>
							<CardHeader className="grid gap-4 md:grid-cols-[120px_1fr_auto]">
								<div className="relative hidden aspect-[4/3] overflow-hidden rounded-md border bg-secondary md:block">
									<Image
										src={articleAssets[index % articleAssets.length]}
										alt=""
										fill
										sizes="120px"
										className={index === 2 ? "object-contain p-5" : "object-cover"}
									/>
								</div>
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
						<CardContent className="space-y-4">
							<div className="relative">
								<Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input className="pl-9" placeholder="Search public resources" />
							</div>
							<div className="relative aspect-[16/7] overflow-hidden rounded-md border bg-secondary">
								<Image src="/code-form-cover.png" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
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
