import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaBand({
	title = "Have an organization to develop?",
	body = "Tell us what you are working toward and we will help you find the right engagement.",
	cta = "Get in touch",
	href = "/contact",
}: {
	title?: string;
	body?: string;
	cta?: string;
	href?: string;
}) {
	return (
		<section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
			<div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-accent p-8 text-accent-foreground sm:flex-row sm:items-center sm:p-12">
				<div>
					<h2 className="font-heading text-3xl">{title}</h2>
					<p className="mt-2 max-w-xl text-sm text-accent-foreground/85">{body}</p>
				</div>
				<Button asChild variant="secondary" className="shrink-0">
					<Link href={href}>
						{cta}
						<ArrowRight />
					</Link>
				</Button>
			</div>
		</section>
	);
}
