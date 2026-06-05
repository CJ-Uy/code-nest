import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicArticles } from "@/lib/public-content";

export default function ArticlesPage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<header className="border-b bg-card">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
					<Link href="/" aria-label="CODE home">
						<Image src="/code-logo-full-navy.png" alt="CODE" width={132} height={44} priority style={{ height: "auto" }} />
					</Link>
					<Button asChild variant="ghost" size="sm">
						<Link href="/">
							<ArrowLeft />
							Home
						</Link>
					</Button>
				</div>
			</header>
			<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
				<div>
					<p className="text-xs font-semibold uppercase text-muted-foreground">CODE publishing</p>
					<h1 className="mt-3 text-5xl font-bold">Articles</h1>
					<p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
						Public writing, explainers, and non-confidential case notes.
					</p>
				</div>
				<div className="mt-8 grid gap-4">
					{publicArticles.map((article) => (
						<Card key={article.slug}>
							<CardHeader className="grid gap-3 md:grid-cols-[1fr_auto]">
								<div>
									<div className="flex flex-wrap gap-2">
										<Badge variant="outline">{article.category}</Badge>
										<Badge variant="secondary">{article.readTime}</Badge>
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
			</div>
		</main>
	);
}
