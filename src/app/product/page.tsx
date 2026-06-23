import Link from "next/link";
import { ArrowUpRight, Clock, Search } from "lucide-react";
import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { ARTICLE_CATS, ARTICLES } from "@/content/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Product Center — CODE" };

export default async function ProductCenterPage({
	searchParams,
}: {
	searchParams: Promise<{ cat?: string; q?: string }>;
}) {
	const { cat, q } = await searchParams;
	const category = cat && ARTICLE_CATS.includes(cat) ? cat : "All";
	const query = q?.trim().toLowerCase() ?? "";

	const articles = ARTICLES.filter((article) => {
		if (category !== "All" && article.cat !== category) return false;
		if (query) {
			const haystack = `${article.title} ${article.dek} ${article.cat}`.toLowerCase();
			if (!haystack.includes(query)) return false;
		}
		return true;
	});

	return (
		<div className="min-h-screen bg-background text-foreground">
			<SiteHeader />

			<section className="border-b border-border bg-card">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Product Center</p>
					<h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight sm:text-5xl">OD ideas, written down</h1>
					<p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
						Short reads on the concepts and methods CODE uses in its work — from organization identity to planned change.
					</p>
				</div>
			</section>

			<section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				<form className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" action="/product">
					{category !== "All" ? <input type="hidden" name="cat" value={category} /> : null}
					<div className="flex flex-wrap gap-2">
						{ARTICLE_CATS.map((item) => {
							const href = item === "All" ? "/product" : `/product?cat=${encodeURIComponent(item)}`;
							const active = category === item;
							return (
								<Link
									key={item}
									href={href}
									className={
										active
											? "rounded-full border border-accent bg-secondary px-3 py-1.5 text-sm font-medium text-foreground"
											: "rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
									}
								>
									{item}
								</Link>
							);
						})}
					</div>
					<div className="relative sm:w-72">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input name="q" defaultValue={q ?? ""} placeholder="Search articles" className="pl-9" />
					</div>
				</form>

				<div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{articles.length === 0 ? (
						<p className="text-sm text-muted-foreground">No articles match your search.</p>
					) : (
						articles.map((article) => (
							<Link
								key={article.id}
								href={`/product/${article.id}`}
								className="group flex flex-col rounded-2xl border border-border p-6 transition-colors hover:border-accent"
							>
								<span className="text-xs font-semibold uppercase tracking-wide text-accent">{article.cat}</span>
								<h2 className="mt-2 font-heading text-xl leading-snug group-hover:text-accent">{article.title}</h2>
								<p className="mt-2 flex-1 text-sm text-muted-foreground">{article.dek}</p>
								<div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
									<span className="inline-flex items-center gap-1">
										<Clock className="size-3" />
										{article.read}
									</span>
									<ArrowUpRight className="size-4 text-foreground" />
								</div>
							</Link>
						))
					)}
				</div>
			</section>

			<SiteFooter />
		</div>
	);
}
