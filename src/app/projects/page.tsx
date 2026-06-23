import { Check } from "lucide-react";
import type { Metadata } from "next";
import { CtaBand } from "@/components/public/cta-band";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { PROJECTS } from "@/content/site";

export const dynamic = "force-static";
export const metadata: Metadata = { title: "Projects — CODE" };

export default function ProjectsPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SiteHeader />

			<section className="border-b border-border bg-card">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Projects</p>
					<h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight sm:text-5xl">Flagship programs for the youth sector</h1>
					<p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
						Beyond client engagements, CODE runs its own programs that bring OD to youth leaders across the country.
					</p>
				</div>
			</section>

			<section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:px-8">
				{PROJECTS.map((project) => (
					<article key={project.id} className="grid gap-6 rounded-3xl border border-border p-6 sm:p-8 lg:grid-cols-[1fr_1.6fr]">
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-3">
								<span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary font-heading text-xl text-primary-foreground">
									{project.short}
								</span>
								<div>
									<h2 className="font-heading text-2xl leading-tight">{project.name}</h2>
									<p className="text-sm text-accent">{project.kicker}</p>
								</div>
							</div>
							<p className="text-sm italic text-muted-foreground">{project.theme}</p>
							<div className="mt-auto grid grid-cols-2 gap-3">
								{project.stat.map((stat) => (
									<div key={stat.k} className="rounded-xl bg-secondary/50 p-3">
										<p className="font-heading text-lg text-foreground">{stat.k}</p>
										<p className="text-xs text-muted-foreground">{stat.v}</p>
									</div>
								))}
							</div>
						</div>
						<div className="flex flex-col gap-4">
							<p className="leading-relaxed text-foreground/90">{project.summary}</p>
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-accent">Goals</p>
								<ul className="mt-2 grid gap-2">
									{project.goals.map((goal) => (
										<li key={goal} className="flex items-start gap-2 text-sm text-muted-foreground">
											<Check className="mt-0.5 size-4 shrink-0 text-accent" />
											{goal}
										</li>
									))}
								</ul>
							</div>
						</div>
					</article>
				))}
			</section>

			<div className="pt-4">
				<CtaBand
					title="Want to partner on a program?"
					body="We collaborate with universities, non-profits, and youth orgs across the Philippines."
					cta="Reach out"
				/>
			</div>
			<SiteFooter />
		</div>
	);
}
