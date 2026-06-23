import { Check } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CtaBand } from "@/components/public/cta-band";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { SERVICES, SERVICES_INTRO } from "@/content/site";

export const dynamic = "force-static";
export const metadata: Metadata = { title: "Services — CODE" };

const PROCESS = [
	{ step: "01", title: "Listen", body: "We start by understanding your org's context, history, and the change you are after." },
	{ step: "02", title: "Diagnose", body: "We research and surface the real dynamics — not just the presenting symptom." },
	{ step: "03", title: "Design", body: "We tailor an engagement to your needs instead of running a generic program." },
	{ step: "04", title: "Deliver", body: "We facilitate the work and leave you with something that holds after we go." },
];

export default function ServicesPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<SiteHeader />

			<section className="border-b border-border bg-card">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Services</p>
					<h1 className="mt-3 max-w-3xl font-heading text-4xl leading-tight sm:text-5xl">Engagements tailor-fit to your organization</h1>
					<p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{SERVICES_INTRO}</p>
				</div>
			</section>

			<section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
				{SERVICES.map((service) => (
					<Card key={service.id} className="flex flex-col">
						<CardHeader>
							<Badge variant="info" className="w-fit">{service.tag}</Badge>
							<CardTitle className="text-xl">{service.title}</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-1 flex-col gap-4">
							<p className="text-sm leading-relaxed text-muted-foreground">{service.summary}</p>
							<ul className="grid gap-2">
								{service.points.map((point) => (
									<li key={point} className="flex items-start gap-2 text-sm">
										<Check className="mt-0.5 size-4 shrink-0 text-accent" />
										{point}
									</li>
								))}
							</ul>
							<p className="mt-auto border-t border-border pt-3 text-xs text-muted-foreground">{service.meta}</p>
						</CardContent>
					</Card>
				))}
			</section>

			<section className="bg-card">
				<div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
					<h2 className="font-heading text-3xl">How an engagement runs</h2>
					<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{PROCESS.map((phase) => (
							<div key={phase.step} className="rounded-2xl border border-border p-6">
								<span className="font-heading text-3xl text-secondary-foreground/30">{phase.step}</span>
								<h3 className="mt-2 font-heading text-lg">{phase.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{phase.body}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<div className="pt-16">
				<CtaBand />
			</div>
			<SiteFooter />
		</div>
	);
}
