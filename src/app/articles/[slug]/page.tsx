import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArticle, publicArticles } from "@/lib/public-content";

export function generateStaticParams() {
	return publicArticles.map((article) => ({ slug: article.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const article = getArticle(slug);

	if (!article) {
		notFound();
	}

	return (
		<main className="min-h-screen bg-background text-foreground">
			<article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
				<Button asChild variant="ghost" size="sm">
					<Link href="/articles">
						<ArrowLeft />
						Articles
					</Link>
				</Button>
				<div className="mt-10">
					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">{article.category}</Badge>
						<Badge variant="secondary">{article.date}</Badge>
						<Badge variant="secondary">{article.readTime}</Badge>
					</div>
					<h1 className="mt-5 text-4xl font-semibold tracking-normal sm:text-5xl">{article.title}</h1>
					<p className="mt-5 text-lg leading-8 text-muted-foreground">{article.excerpt}</p>
				</div>
				<div className="mt-10 space-y-6 border-t pt-8 text-base leading-8">
					<p>
						This public version gives readers the useful frame without exposing private member notes,
						confidential case records, or internal feedback.
					</p>
					<p>
						The member portal keeps the fuller library, saved lists, CRS records, comments, and admin queues
						behind member access.
					</p>
					<p>
						Public publishing should be calm, specific, and easy to scan. Internal tools can be denser because
						members return to them for repeated work.
					</p>
				</div>
			</article>
		</main>
	);
}
